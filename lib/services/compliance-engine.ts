/**
 * Compliance Engine — hybrid regex + LLM evaluation.
 * Mirrors §4.2.5 of the FYP report.
 */

import { prisma } from "@/lib/db";
import { chatComplete } from "@/lib/openai";
import { auditLog } from "./audit-service";
import { createNotification } from "./notification-service";

export async function runComplianceCheck(documentId: string, userId: string) {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc?.extractedText) throw new Error("Document text not available");

  const rules = await prisma.complianceRule.findMany({ where: { isActive: true } });
  const regexRules = rules.filter((r) => r.rulePattern && !r.requiresLLM);
  const llmRules = rules.filter((r) => r.requiresLLM);

  type CheckRow = {
    ruleId: string;
    status: "COMPLIANT" | "NON_COMPLIANT" | "PARTIAL";
    matchedText: string | null;
    confidenceScore: number | null;
    explanation: string | null;
  };

  // Phase 1 — regex
  const phase1: CheckRow[] = regexRules.map((rule): CheckRow => {
    try {
      const re = new RegExp(rule.rulePattern!, "ui");
      const m = re.exec(doc.extractedText!);
      const status = m ? "COMPLIANT" : "NON_COMPLIANT";
      return {
        ruleId: rule.id,
        status,
        matchedText: m?.[0] || null,
        confidenceScore: null,
        explanation: null,
      };
    } catch {
      return { ruleId: rule.id, status: "NON_COMPLIANT", matchedText: null, confidenceScore: null, explanation: "Invalid regex pattern" };
    }
  });

  // Phase 2 — LLM (batched 5 per call)
  const phase2: CheckRow[] = [];
  for (let i = 0; i < llmRules.length; i += 5) {
    const batch = llmRules.slice(i, i + 5);
    const prompt = `Evaluate the following compliance rules against the contract text. Respond ONLY with JSON: { "results": [ { "ruleIndex": number, "status": "COMPLIANT"|"NON_COMPLIANT"|"PARTIAL", "confidence": 0.0-1.0, "explanation": string } ] }

CONTRACT:
"""${doc.extractedText.slice(0, 10000)}"""

RULES:
${batch.map((r, idx) => `${idx}. ${r.name}: ${r.description}`).join("\n")}`;
    const raw = await chatComplete(
      [{ role: "user", content: prompt }],
      { temperature: 0.1, jsonMode: true }
    );
    let parsed: any = { results: [] };
    try { parsed = JSON.parse(raw); } catch { /* keep empty */ }
    for (const r of parsed.results || []) {
      const rule = batch[r.ruleIndex];
      if (!rule) continue;
      phase2.push({
        ruleId: rule.id,
        status: r.status,
        matchedText: null,
        confidenceScore: Number(r.confidence) || 0.75,
        explanation: r.explanation || null,
      });
    }
  }

  const all = [...phase1, ...phase2];

  // Persist
  await prisma.complianceCheck.createMany({
    data: all.map((r) => ({
      documentId,
      userId,
      ruleId: r.ruleId,
      status: r.status,
      matchedText: r.matchedText,
      confidenceScore: r.confidenceScore,
      explanation: r.explanation,
    })),
  });

  const compliant = all.filter((r) => r.status === "COMPLIANT").length;
  const score = all.length ? Math.round((compliant / all.length) * 100) : 100;

  await createNotification({
    userId,
    type: "COMPLIANCE_COMPLETE",
    title: "Compliance check complete",
    body: `${doc.originalName}: ${compliant}/${all.length} rules compliant (${score}%).`,
    resourceId: documentId,
    priority: score < 60 ? "HIGH" : "MEDIUM",
  });

  await auditLog({ userId, action: "COMPLIANCE_RUN", resourceType: "Document", resourceId: documentId });

  return { score, total: all.length, compliant, results: all };
}
