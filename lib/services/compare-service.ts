/**
 * Document Compare Service — clause-level diff between two documents (or 3-way).
 * Mirrors §4.2.6 of the FYP report, extended with 3-way comparison.
 */

import { prisma } from "@/lib/db";
import { chatComplete } from "@/lib/openai";
import { embed } from "@/lib/openai";
import { cosineSimilarity, safeJson } from "@/lib/utils";

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

export async function compareTwo(docAId: string, docBId: string): Promise<CompareResult> {
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

  // Sanity: recompute similarity from clause embeddings if we have them.
  try {
    const texts = [...aClauses.map((c) => c.text), ...bClauses.map((c) => c.text)];
    if (texts.length > 1) {
      const vecs = await embed(texts);
      const aVecs = vecs.slice(0, aClauses.length);
      const bVecs = vecs.slice(aClauses.length);
      const sims: number[] = [];
      for (const av of aVecs) {
        const best = bVecs.reduce((acc, bv) => Math.max(acc, cosineSimilarity(av, bv)), 0);
        sims.push(best);
      }
      if (sims.length) parsed.similarityScore = sims.reduce((s, v) => s + v, 0) / sims.length;
    }
  } catch { /* ignore */ }

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
