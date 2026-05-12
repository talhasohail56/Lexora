import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTeamWorkspace, userHasFirmPlan } from "@/lib/services/team-service";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getTeamWorkspace(session.userId);
  const canCreateFirm = !workspace && (await userHasFirmPlan(session.userId));

  return NextResponse.json({
    workspace,
    canCreateFirm,
    firmPlanActive: workspace?.firmPlanActive ?? false,
  });
}
