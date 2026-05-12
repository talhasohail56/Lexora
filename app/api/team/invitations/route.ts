import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getTeamWorkspace, inviteFirmMember } from "@/lib/services/team-service";

const Body = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const workspace = await getTeamWorkspace(session.userId);
    if (!workspace?.canManage) return NextResponse.json({ error: "Only firm admins can invite members" }, { status: 403 });
    const data = Body.parse(await req.json());
    const result = await inviteFirmMember({
      firmId: workspace.firm.id,
      invitedById: session.userId,
      invitedByName: session.name,
      email: data.email,
      role: data.role,
      appUrl: req.nextUrl.origin,
    });
    return NextResponse.json({
      success: true,
      emailSent: result.emailSent,
      emailError: result.emailSent ? undefined : result.emailError,
      invitation: result.invitation,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Could not invite member" }, { status: 400 });
  }
}
