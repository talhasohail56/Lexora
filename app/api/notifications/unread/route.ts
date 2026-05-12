import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { unreadCount } from "@/lib/services/notification-service";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ count: 0 });
  const count = await unreadCount(s.userId);
  return NextResponse.json({ count });
}
