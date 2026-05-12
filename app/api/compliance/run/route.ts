import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { runComplianceCheck } from "@/lib/services/compliance-engine";
import { consumeFeature, subscriptionError } from "@/lib/services/subscription-service";

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { documentId } = await req.json();
  if (!documentId) return NextResponse.json({ error: "documentId required" }, { status: 400 });
  try {
    await consumeFeature(s, "complianceRuns", 1, { documentId });
    const out = await runComplianceCheck(documentId, s.userId);
    return NextResponse.json(out);
  } catch (e: any) {
    if (String(e.message).includes("SUBSCRIPTION") || String(e.message).includes("PLAN_") || String(e.message).includes("ROLE_")) {
      const out = subscriptionError(e, "complianceRuns");
      return NextResponse.json(out.body, { status: out.status });
    }
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
