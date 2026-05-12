import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession, setSessionCookie, signSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { auditLog } from "@/lib/services/audit-service";

const Body = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  organization: z.string().trim().max(140).optional().default(""),
  jurisdiction: z.string().trim().min(2).max(80).optional().default("Pakistan"),
  barNumber: z.string().trim().max(80).optional().default(""),
  persona: z.string().trim().max(80).optional().default(""),
  practiceArea: z.string().trim().max(100).optional().default(""),
  primaryUseCase: z.string().trim().max(800).optional().default(""),
  preferredTone: z.string().trim().max(80).optional().default("Detailed with citations"),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = Body.parse(await req.json());
  const roleLabel = session.role === "LAWYER" ? "Lawyer" : session.role === "ADMIN" ? "Admin" : "User";
  const profileSummary = [
    `${roleLabel} workspace`,
    data.practiceArea ? `focus: ${data.practiceArea}` : null,
    data.persona ? `persona: ${data.persona}` : null,
    `jurisdiction: ${data.jurisdiction || "Pakistan"}`,
    `tone: ${data.preferredTone || "Detailed with citations"}`,
  ].filter(Boolean).join(" | ");

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: {
      ...(data.name ? { name: data.name } : {}),
      onboardingComplete: true,
      organization: data.organization || null,
      jurisdiction: data.jurisdiction || "Pakistan",
      barNumber: session.role === "LAWYER" ? data.barNumber || null : null,
      persona: data.persona || null,
      practiceArea: data.practiceArea || null,
      primaryUseCase: data.primaryUseCase || null,
      preferredTone: data.preferredTone || "Detailed with citations",
      profileSummary,
    },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      role: true,
      organization: true,
      jurisdiction: true,
      barNumber: true,
      persona: true,
      practiceArea: true,
      primaryUseCase: true,
      preferredTone: true,
      profileSummary: true,
      onboardingComplete: true,
    },
  });

  if (data.name && data.name !== session.name) {
    const token = await signSession({
      userId: session.userId,
      role: session.role,
      email: session.email,
      name: data.name,
    });
    await setSessionCookie(token);
  }

  void auditLog({
    userId: session.userId,
    action: "PROFILE_SETUP_COMPLETED",
    resourceType: "User",
    resourceId: session.userId,
    metadata: { role: session.role, jurisdiction: user.jurisdiction },
  });

  return NextResponse.json({ user });
}
