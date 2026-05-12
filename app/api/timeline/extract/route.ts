import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { extractTimeline } from "@/lib/services/timeline-service";
import { consumeFeature, subscriptionError } from "@/lib/services/subscription-service";

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { documentId } = await req.json();
  try {
    await consumeFeature(s, "timelines", 1, { documentId });
    const events = await extractTimeline(documentId);
    return NextResponse.json({ events });
  } catch (e: any) {
    if (String(e.message).includes("SUBSCRIPTION") || String(e.message).includes("PLAN_") || String(e.message).includes("ROLE_")) {
      const out = subscriptionError(e, "timelines");
      return NextResponse.json(out.body, { status: out.status });
    }
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
