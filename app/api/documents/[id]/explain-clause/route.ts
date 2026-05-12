import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { explainClause } from "@/lib/services/ai-analyzer-service";
import { consumeFeature, subscriptionError } from "@/lib/services/subscription-service";

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { clauseId } = await req.json();
    await consumeFeature(s, "aiAnalysis", 1, { clauseId });
    const explanation = await explainClause(clauseId);
    return NextResponse.json({ explanation });
  } catch (e: any) {
    if (String(e.message).includes("SUBSCRIPTION") || String(e.message).includes("PLAN_") || String(e.message).includes("ROLE_")) {
      const out = subscriptionError(e, "aiAnalysis");
      return NextResponse.json(out.body, { status: out.status });
    }
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
