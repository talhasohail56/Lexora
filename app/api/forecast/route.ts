import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { consumeFeature, subscriptionError } from "@/lib/services/subscription-service";

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const documentId = new URL(req.url).searchParams.get("documentId");
  if (!documentId) return NextResponse.json({ error: "documentId required" }, { status: 400 });
  try {
    await consumeFeature(s, "forecast", 1, { documentId });
  } catch (e: any) {
    const out = subscriptionError(e, "forecast");
    return NextResponse.json(out.body, { status: out.status });
  }

  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId: s.userId },
    include: { risks: true, clauses: true },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Simple Bayesian-style forecast using risk severity & clause coverage.
  const sev = doc.risks.reduce((m: Record<string, number>, r) => ({ ...m, [r.severity]: (m[r.severity] || 0) + 1 }), {});
  const score = (doc.riskScore || 0);
  const favourable = Math.max(5, Math.round(100 - score * 1.05));
  const unfavourable = Math.min(85, Math.round(score * 0.9));
  const mixed = Math.max(0, 100 - favourable - unfavourable);

  const factors = [
    { name: "Liability cap",     weight: Math.min(100, 30 + (sev.HIGH || 0) * 15) },
    { name: "Indemnification",   weight: Math.min(100, 40 + (sev.CRITICAL || 0) * 20) },
    { name: "Termination",       weight: Math.min(100, 25 + (sev.MEDIUM || 0) * 10) },
    { name: "Confidentiality",   weight: Math.min(100, 35 + ((doc.clauses.find((c) => c.clauseType === "Confidentiality") ? 5 : 25))) },
    { name: "Governing law",     weight: Math.min(100, doc.clauses.find((c) => c.clauseType === "GoverningLaw") ? 20 : 75) },
    { name: "Dispute resolution", weight: Math.min(100, doc.clauses.find((c) => c.clauseType === "Dispute") ? 25 : 70) },
  ];

  const rationale = `Based on ${doc.risks.length} risk signals (${sev.CRITICAL || 0} critical, ${sev.HIGH || 0} high) across ${doc.clauses.length} extracted clauses, the aggregate risk score of ${score}/100 suggests a ${favourable > 50 ? "favourable" : "guarded"} litigation posture. Liability and indemnification are the strongest contributing factors. Note: this is a heuristic Bayesian model and should not substitute professional legal judgment.`;

  return NextResponse.json({ favourable, mixed, unfavourable, factors, rationale });
}
