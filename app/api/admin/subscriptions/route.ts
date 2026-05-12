import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listUserSubscriptions } from "@/lib/services/subscription-service";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const subscriptions = await listUserSubscriptions();
  return NextResponse.json({ subscriptions });
}
