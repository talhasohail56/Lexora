import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { compareTwo, compareThree } from "@/lib/services/compare-service";
import { consumeFeature, subscriptionError } from "@/lib/services/subscription-service";

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { ids } = await req.json() as { ids: string[] };
  if (!Array.isArray(ids) || ids.length < 2) return NextResponse.json({ error: "Need 2 or 3 ids" }, { status: 400 });
  try {
    await consumeFeature(s, "comparisons", 1, { ids });
    if (ids.length === 2) return NextResponse.json(await compareTwo(ids[0], ids[1]));
    if (ids.length === 3) return NextResponse.json(await compareThree([ids[0], ids[1], ids[2]]));
    return NextResponse.json({ error: "Max 3 documents" }, { status: 400 });
  } catch (e: any) {
    if (String(e.message).includes("SUBSCRIPTION") || String(e.message).includes("PLAN_") || String(e.message).includes("ROLE_")) {
      const out = subscriptionError(e, "comparisons");
      return NextResponse.json(out.body, { status: out.status });
    }
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
