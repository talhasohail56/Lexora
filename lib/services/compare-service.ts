/**
 * Document Compare Service — clause-level diff between two documents (or 3-way).
 * Mirrors §4.2.6 of the FYP report, extended with 3-way comparison.
 */

import { prisma } from "@/lib/db";
import { chatComplete } from "@/lib/openai";

export type CompareDifference = {
  area: string;
  changeType: "ADDED" | "REMOVED" | "MODIFIED";
  before?: string | null;
  after?: string | null;
  impact: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommendation: string;
};

export type CompareResult = {
  summary: string;
  keyDifferences: CompareDifference[];
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
  if (tokens.length < size) {
    if (tokens.length) out.add(tokens.join(" "));
    return out;
  }
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

function clip(text: string | null | undefined, max = 900) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max).trim()}...` : clean;
}

function riskLevelFor(text: string) {
  const s = text.toLowerCase();
  if (/unlimited|indemn|liabil|penalt|terminate immediately|breach|damages|injunct|personal data|confidential/i.test(s)) return "HIGH";
  if (/payment|notice|renew|jurisdiction|arbitration|warranty|ip|intellectual/i.test(s)) return "MEDIUM";
  return "LOW";
}

function recommendationFor(changeType: CompareDifference["changeType"], area: string, text: string) {
  const lower = `${area} ${text}`.toLowerCase();
  if (/indemn|liabil/.test(lower)) return "Review the risk allocation and add a clear cap, carve-outs, and mutual wording where appropriate.";
  if (/payment|fee|invoice/.test(lower)) return "Confirm the commercial position, due dates, late-payment consequences, and any tax treatment before signature.";
  if (/terminate|notice/.test(lower)) return "Check whether the notice period and breach cure rights match the business relationship.";
  if (/jurisdiction|governing|arbitration|dispute/.test(lower)) return "Confirm the forum, governing law, and dispute process are acceptable under the intended Pakistan-facing transaction.";
  if (/confidential|data|privacy/.test(lower)) return "Confirm confidentiality duration, permitted disclosures, and data-handling obligations.";
  if (changeType === "ADDED") return "Review this new obligation before accepting it, especially if it creates cost, liability, or operational duties.";
  if (changeType === "REMOVED") return "Confirm this deletion is intentional and does not remove a protection you still need.";
  return "Review the changed wording and accept only if the new allocation of rights and obligations is intended.";
}

function differenceFromAdded(item: { clauseType: string; text: string }): CompareDifference {
  return {
    area: item.clauseType || "Added clause",
    changeType: "ADDED",
    before: null,
    after: clip(item.text),
    impact: "Document B adds an obligation or protection that was not present in Document A.",
    riskLevel: riskLevelFor(item.text),
    recommendation: recommendationFor("ADDED", item.clauseType, item.text),
  };
}

function differenceFromRemoved(item: { clauseType: string; text: string }): CompareDifference {
  return {
    area: item.clauseType || "Removed clause",
    changeType: "REMOVED",
    before: clip(item.text),
    after: null,
    impact: "Document B removes wording that existed in Document A, which may remove a right, duty, or protection.",
    riskLevel: riskLevelFor(item.text),
    recommendation: recommendationFor("REMOVED", item.clauseType, item.text),
  };
}

function differenceFromModified(item: { clauseType: string; before: string; after: string }): CompareDifference {
  return {
    area: item.clauseType || "Modified clause",
    changeType: "MODIFIED",
    before: clip(item.before),
    after: clip(item.after),
    impact: "The clause exists in both documents, but the wording changes the practical rights, duties, timing, or risk allocation.",
    riskLevel: riskLevelFor(`${item.before} ${item.after}`),
    recommendation: recommendationFor("MODIFIED", item.clauseType, `${item.before} ${item.after}`),
  };
}

function deterministicCompare(
  aClauses: { type: string; text: string }[],
  bClauses: { type: string; text: string }[]
): Pick<CompareResult, "added" | "removed" | "modified" | "unchanged"> {
  const usedA = new Set<number>();
  const added: CompareResult["added"] = [];
  const removed: CompareResult["removed"] = [];
  const modified: CompareResult["modified"] = [];
  let unchanged = 0;

  for (const b of bClauses) {
    let bestIndex = -1;
    let bestScore = 0;
    for (let i = 0; i < aClauses.length; i += 1) {
      if (usedA.has(i)) continue;
      const a = aClauses[i];
      const sameType = a.type.toLowerCase() === b.type.toLowerCase();
      const score = calculateDocumentSimilarity(a.text, b.text) + (sameType ? 0.08 : 0);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    if (bestIndex >= 0 && bestScore >= 0.96) {
      unchanged += 1;
      usedA.add(bestIndex);
    } else if (bestIndex >= 0 && bestScore >= 0.28) {
      usedA.add(bestIndex);
      modified.push({
        clauseType: b.type,
        before: aClauses[bestIndex].text,
        after: b.text,
      });
    } else {
      added.push({ clauseType: b.type, text: b.text });
    }
  }

  aClauses.forEach((a, i) => {
    if (!usedA.has(i)) removed.push({ clauseType: a.type, text: a.text });
  });

  return { added, removed, modified, unchanged };
}

function normalizeArray<T>(input: unknown): T[] {
  return Array.isArray(input) ? input : [];
}

function normalizeDifference(input: any): CompareDifference | null {
  const changeType = String(input?.changeType || "").toUpperCase();
  if (!["ADDED", "REMOVED", "MODIFIED"].includes(changeType)) return null;
  const area = clip(input?.area || input?.clauseType || "Contract term", 90);
  const before = clip(input?.before || null);
  const after = clip(input?.after || null);
  const impact = clip(input?.impact || "This change may affect the parties' rights, obligations, or risk allocation.", 420);
  const risk = String(input?.riskLevel || riskLevelFor(`${before} ${after} ${impact}`)).toUpperCase();
  return {
    area,
    changeType: changeType as CompareDifference["changeType"],
    before,
    after,
    impact,
    riskLevel: ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(risk) ? risk as CompareDifference["riskLevel"] : "MEDIUM",
    recommendation: clip(input?.recommendation || recommendationFor(changeType as CompareDifference["changeType"], area, `${before} ${after}`), 420),
  };
}

function buildKeyDifferences(result: Pick<CompareResult, "added" | "removed" | "modified">, existing: unknown) {
  const fromModel = normalizeArray<any>(existing)
    .map(normalizeDifference)
    .filter((item): item is CompareDifference => Boolean(item));

  if (fromModel.length) return fromModel.slice(0, 12);

  return [
    ...result.modified.map(differenceFromModified),
    ...result.added.map(differenceFromAdded),
    ...result.removed.map(differenceFromRemoved),
  ].slice(0, 12);
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
  const deterministic = deterministicCompare(aClauses, bClauses);

  const prompt = `Compare these two contract clause sets. Return ONLY JSON with this exact shape:
{
  "summary": "2-4 sentence plain-English explanation of the most important differences",
  "keyDifferences": [
    {
      "area": "clause or business area",
      "changeType": "ADDED" | "REMOVED" | "MODIFIED",
      "before": "Document A wording, or null",
      "after": "Document B wording, or null",
      "impact": "why this difference matters legally or commercially",
      "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "recommendation": "specific action the reviewer should take"
    }
  ],
  "added": [{ "clauseType": string, "text": string }],
  "removed": [{ "clauseType": string, "text": string }],
  "modified": [{ "clauseType": string, "before": string, "after": string }],
  "unchanged": number,
  "similarityScore": 0.0
}

Treat Document A as the old/base version and Document B as the new/revised version. Focus on actual wording differences, changed obligations, missing protections, increased liability, payment changes, termination rights, confidentiality/data handling, governing law, dispute resolution, and signature/compliance requirements. Do not say documents are identical unless the wording is substantially identical.

DOC A clauses:
${JSON.stringify(aClauses, null, 2)}

DOC B clauses:
${JSON.stringify(bClauses, null, 2)}`;

  const raw = await chatComplete([{ role: "user", content: prompt }], { temperature: 0.2, jsonMode: true });
  let parsed: any;
  try { parsed = JSON.parse(raw); } catch {
    parsed = {};
  }

  const textA = aClauses.map((clause) => clause.text).join("\n\n");
  const textB = bClauses.map((clause) => clause.text).join("\n\n");
  const similarityScore = calculateDocumentSimilarity(textA, textB);
  const modelAdded = normalizeArray<CompareResult["added"][number]>(parsed.added)
    .filter((item) => item?.text)
    .map((item) => ({ clauseType: clip(item.clauseType || "Added", 80), text: clip(item.text) }));
  const modelRemoved = normalizeArray<CompareResult["removed"][number]>(parsed.removed)
    .filter((item) => item?.text)
    .map((item) => ({ clauseType: clip(item.clauseType || "Removed", 80), text: clip(item.text) }));
  const modelModified = normalizeArray<CompareResult["modified"][number]>(parsed.modified)
    .filter((item) => item?.before || item?.after)
    .map((item) => ({
      clauseType: clip(item.clauseType || "Modified", 80),
      before: clip(item.before),
      after: clip(item.after),
    }));

  const hasModelDiffs = modelAdded.length || modelRemoved.length || modelModified.length;
  const base = hasModelDiffs
    ? {
      added: modelAdded,
      removed: modelRemoved,
      modified: modelModified,
      unchanged: Number(parsed.unchanged) || deterministic.unchanged,
    }
    : deterministic;

  const result: CompareResult = {
    summary: clip(
      parsed.summary ||
      (similarityScore >= 0.98
        ? "The documents are nearly identical. Only minor wording or formatting differences were detected."
        : `Document B differs from Document A across ${base.added.length + base.removed.length + base.modified.length} material area(s). Review the listed changes before relying on the revised version.`),
      700
    ),
    keyDifferences: buildKeyDifferences(base, parsed.keyDifferences),
    ...base,
    similarityScore,
  };

  return result;
}

export async function compareThree(ids: [string, string, string]) {
  const [ab, ac, bc] = await Promise.all([
    compareTwo(ids[0], ids[1]),
    compareTwo(ids[0], ids[2]),
    compareTwo(ids[1], ids[2]),
  ]);
  return { ab, ac, bc };
}
