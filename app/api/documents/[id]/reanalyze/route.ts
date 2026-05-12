import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { analyseDocument } from "@/lib/services/ai-analyzer-service";
import { consumeFeature, subscriptionError } from "@/lib/services/subscription-service";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await consumeFeature(s, "aiAnalysis", 1, { documentId: params.id });
    // Reset prior analysis
    await prisma.clause.deleteMany({ where: { documentId: params.id } });
    await prisma.risk.deleteMany({ where: { documentId: params.id } });
    const result = await analyseDocument(params.id);
    return NextResponse.json({ success: true, result });
  } catch (e: any) {
    if (String(e.message).includes("SUBSCRIPTION") || String(e.message).includes("PLAN_") || String(e.message).includes("ROLE_")) {
      const out = subscriptionError(e, "aiAnalysis");
      return NextResponse.json(out.body, { status: out.status });
    }
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
