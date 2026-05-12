import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listMessages } from "@/lib/services/chat-service";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const messages = await listMessages(params.id, s.userId);
    return NextResponse.json({ messages });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 404 });
  }
}
