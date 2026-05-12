import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { cancelSubscription, getSubscriptionContext } from "@/lib/services/subscription-service";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const subscription = await getSubscriptionContext(session.userId, session.role);
  return NextResponse.json({ subscription });
}

export async function PATCH() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await cancelSubscription(session.userId);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
