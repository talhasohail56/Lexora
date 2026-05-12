import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listNotifications } from "@/lib/services/notification-service";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json([], { status: 401 });
  return NextResponse.json(await listNotifications(s.userId));
}
