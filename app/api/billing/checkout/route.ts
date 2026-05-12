import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { switchPlan } from "@/lib/services/subscription-service";

const Body = z.object({ planCode: z.string().min(2).max(40) });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { planCode } = Body.parse(await req.json());
    const subscription = await switchPlan(session.userId, session.role, planCode, session.userId);
    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      planName: subscription.plan.name,
      provider: "MANUAL",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
