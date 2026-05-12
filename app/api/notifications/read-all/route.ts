import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { markAllRead } from "@/lib/services/notification-service";

export async function POST() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await markAllRead(s.userId);
  return NextResponse.json({ success: true });
}
