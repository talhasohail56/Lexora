import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { acceptFirmInvitation } from "@/lib/services/team-service";

export async function POST(_req: NextRequest, { params }: { params: { token: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const firm = await acceptFirmInvitation(params.token, session.userId);
    return NextResponse.json({ success: true, firm });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Could not accept invitation" }, { status: 400 });
  }
}
