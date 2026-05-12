import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession, setSessionCookie, signSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { auditLog } from "@/lib/services/audit-service";

const Body = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  avatarUrl: z
    .string()
    .trim()
    .max(1_500_000, "Profile picture must be under 1.5 MB")
    .optional()
    .default("")
    .refine(
      (value) =>
        !value ||
        /^https?:\/\/.+/i.test(value) ||
        /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value),
      "Use a valid image URL or upload a PNG, JPG, WEBP, or GIF"
    ),
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

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid profile data" },
      { status: 400 }
    );
  }
  const data = parsed.data;
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
      avatarUrl: data.avatarUrl || null,
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
      avatarUrl: true,
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
