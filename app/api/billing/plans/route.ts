import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSubscriptionContext, listPlans } from "@/lib/services/subscription-service";

export async function GET() {
  const session = await getSession();
  const plans = await listPlans();
  if (!session) return NextResponse.json({ plans });
  const subscription = await getSubscriptionContext(session.userId, session.role);
  return NextResponse.json({ plans, subscription });
}
