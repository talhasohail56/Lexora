import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { markRead } from "@/lib/services/notification-service";

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await markRead(params.id, s.userId);
  return NextResponse.json({ success: true });
}
