import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { negotiate } from "@/lib/services/drafting-service";
import { consumeFeature, subscriptionError } from "@/lib/services/subscription-service";

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { clause, stance } = await req.json();
    await consumeFeature(s, "negotiator", 1, { stance });
    const response = await negotiate(clause, stance);
    return NextResponse.json({ response });
  } catch (e: any) {
    if (String(e.message).includes("SUBSCRIPTION") || String(e.message).includes("PLAN_") || String(e.message).includes("ROLE_")) {
      const out = subscriptionError(e, "negotiator");
      return NextResponse.json(out.body, { status: out.status });
    }
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
