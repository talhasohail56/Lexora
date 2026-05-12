/**
 * Document Compare Service — clause-level diff between two documents (or 3-way).
 * Mirrors §4.2.6 of the FYP report, extended with 3-way comparison.
 */

import { prisma } from "@/lib/db";
import { chatComplete } from "@/lib/openai";

export type CompareResult = {
  added: { clauseType: string; text: string }[];
  removed: { clauseType: string; text: string }[];
  modified: { clauseType: string; before: string; after: string }[];
  unchanged: number;
  similarityScore: number; // 0..1
};

function sourceClauses(doc: {
  clauses: { clauseType: string; text: string }[];
  extractedText?: string | null;
}) {
  if (doc.clauses.length) {
    return doc.clauses.map((c) => ({ type: c.clauseType, text: c.text }));
  }

  const fallbackText = doc.extractedText || "";
  const sections = fallbackText
    .split(/\n\s*\n|(?=^[A-Z][A-Z\s,&/-]{5,}$)/gm)
    .map((text) => text.trim())
    .filter((text) => text.length > 40)
    .slice(0, 30);

  return (sections.length ? sections : [fallbackText]).map((text, i) => ({
    type: `Section ${i + 1}`,
    text,
  }));
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/["'`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string) {
  return normalizeText(text)
    .split(" ")
    .filter((token) => token.length > 2);
}

function shingles(tokens: string[], size: number) {
  const out = new Set<string>();
  for (let i = 0; i <= tokens.length - size; i += 1) {
    out.add(tokens.slice(i, i + size).join(" "));
  }
  return out;
}

function jaccard(a: Set<string>, b: Set<string>) {
  if (!a.size && !b.size) return 1;
  let intersection = 0;
  for (const value of a) {
    if (b.has(value)) intersection += 1;
  }
  return intersection / (a.size + b.size - intersection || 1);
}

export function calculateDocumentSimilarity(textA: string, textB: string) {
  const normalizedA = normalizeText(textA);
  const normalizedB = normalizeText(textB);
  if (!normalizedA || !normalizedB) return 0;
  if (normalizedA === normalizedB) return 1;

  const tokensA = tokenize(normalizedA);
  const tokensB = tokenize(normalizedB);
  const wordOverlap = jaccard(new Set(tokensA), new Set(tokensB));
  const phraseOverlap = jaccard(shingles(tokensA, 5), shingles(tokensB, 5));
  const lengthSimilarity = Math.min(tokensA.length, tokensB.length) / Math.max(tokensA.length, tokensB.length, 1);

  // Phrase overlap carries most of the score because it catches actual textual
  // similarity. Word overlap alone makes unrelated legal documents look too close.
  return Math.max(0, Math.min(0.99, phraseOverlap * 0.7 + wordOverlap * 0.25 + lengthSimilarity * 0.05));
}

export async function compareTwo(docAId: string, docBId: string): Promise<CompareResult> {
  if (docAId === docBId) throw new Error("Choose two different documents");

  const [a, b] = await Promise.all([
    prisma.document.findUnique({ where: { id: docAId }, include: { clauses: true } }),
    prisma.document.findUnique({ where: { id: docBId }, include: { clauses: true } }),
  ]);
  if (!a || !b) throw new Error("One or both documents not found");

  const aClauses = sourceClauses(a);
  const bClauses = sourceClauses(b);

  const prompt = `Compare these two contract clause sets and return JSON with shape { "added": [{clauseType,text}], "removed": [{clauseType,text}], "modified": [{clauseType,before,after}], "unchanged": number, "similarityScore": 0.0-1.0 }.

DOC A clauses:
${JSON.stringify(aClauses, null, 2)}

DOC B clauses:
${JSON.stringify(bClauses, null, 2)}`;

  const raw = await chatComplete([{ role: "user", content: prompt }], { temperature: 0.2, jsonMode: true });
  let parsed: CompareResult;
  try { parsed = JSON.parse(raw); } catch {
    parsed = { added: [], removed: [], modified: [], unchanged: 0, similarityScore: 0.5 };
  }

  const textA = aClauses.map((clause) => clause.text).join("\n\n");
  const textB = bClauses.map((clause) => clause.text).join("\n\n");
  parsed.similarityScore = calculateDocumentSimilarity(textA, textB);

  return parsed;
}

export async function compareThree(ids: [string, string, string]) {
  const [ab, ac, bc] = await Promise.all([
    compareTwo(ids[0], ids[1]),
    compareTwo(ids[0], ids[2]),
    compareTwo(ids[1], ids[2]),
  ]);
  return { ab, ac, bc };
}
