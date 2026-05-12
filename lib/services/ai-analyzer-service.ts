/**
 * AI Analyzer Service — clause extraction, risk detection, summarisation.
 * Mirrors §4.2.3 of the FYP report.
 */

import { prisma } from "@/lib/db";
import { chatComplete } from "@/lib/openai";
import { computeRiskScore } from "@/lib/utils";
import { auditLog } from "./audit-service";
import { createNotification } from "./notification-service";

const ANALYSIS_PROMPT = `You are a senior legal analyst. Given the contract text below, return a single JSON object with three keys: \`clauses\` (array), \`risks\` (array), \`summary\` (string ≤300 words).

Clause schema: { "clauseType": one of [Confidentiality, Liability, Indemnification, Termination, Payment, IP, Dispute, GoverningLaw, NonCompete, Warranty, ForceMajeure, Amendment, Other], "text": exact quoted text from the document, "confidence": 0.0-1.0 }

Risk schema: { "severity": one of [LOW, MEDIUM, HIGH, CRITICAL], "category": short label, "description": one sentence, "suggestion": one sentence, "confidence": 0.0-1.0 }

Return only valid JSON, no markdown, no commentary.`;

export async function analyseDocument(documentId: string) {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc || !doc.extractedText) throw new Error("Document not ready");

  await prisma.document.update({ where: { id: documentId }, data: { status: "ANALYSING" } });
  const start = Date.now();

  const raw = await chatComplete(
    [
      { role: "system", content: ANALYSIS_PROMPT },
      { role: "user", content: doc.extractedText.slice(0, 24000) },
    ],
    { temperature: 0.1, max_tokens: 4096, jsonMode: true }
  );

  let parsed: { clauses: any[]; risks: any[]; summary: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    // One retry with correction prompt
    const retry = await chatComplete(
      [
        { role: "system", content: ANALYSIS_PROMPT + "\n\nIMPORTANT: previous response was invalid JSON. Return ONLY a valid JSON object." },
        { role: "user", content: doc.extractedText.slice(0, 24000) },
      ],
      { temperature: 0, max_tokens: 4096, jsonMode: true }
    );
    parsed = JSON.parse(retry);
  }

  // Persist clauses
  const clauses = await Promise.all(
    parsed.clauses.map((c) =>
      prisma.clause.create({
        data: {
          documentId,
          clauseType: c.clauseType,
          text: c.text,
          confidence: Number(c.confidence) || 0.8,
        },
      })
    )
  );

  // Persist risks (associate with first matching clause type when possible)
  await Promise.all(
    parsed.risks.map((r) => {
      const clauseId =
        clauses.find((cl) =>
          (cl.clauseType.toLowerCase()).includes((r.category || "").toLowerCase().split(" ")[0])
        )?.id;
      return prisma.risk.create({
        data: {
          documentId,
          clauseId: clauseId || null,
          severity: r.severity,
          category: r.category,
          description: r.description,
          suggestion: r.suggestion,
          confidence: Number(r.confidence) || 0.75,
        },
      });
    })
  );

  const riskScore = computeRiskScore(parsed.risks.map((r) => r.severity));
  await prisma.document.update({
    where: { id: documentId },
    data: {
      status: "COMPLETED",
      summary: parsed.summary,
      riskScore,
      analysisResult: JSON.stringify(parsed),
      processingTime: Date.now() - start,
    },
  });

  await createNotification({
    userId: doc.userId,
    type: "ANALYSIS_COMPLETE",
    title: "Analysis ready",
    body: `${doc.originalName} has been analysed. Risk score: ${riskScore}/100.`,
    resourceId: documentId,
    priority: riskScore >= 70 ? "HIGH" : "MEDIUM",
  });

  await auditLog({ userId: doc.userId, action: "ANALYSE", resourceType: "Document", resourceId: documentId });

  return parsed;
}

export async function explainClause(clauseId: string) {
  const c = await prisma.clause.findUnique({ where: { id: clauseId } });
  if (!c) throw new Error("Clause not found");
  if (c.explanation) return c.explanation;
  const explanation = await chatComplete([
    { role: "system", content: "You explain legal clauses in plain English at an 8th-grade reading level." },
    { role: "user", content: `Explain this clause: "${c.text}"` },
  ], { temperature: 0.3 });
  await prisma.clause.update({ where: { id: clauseId }, data: { explanation } });
  return explanation;
}
