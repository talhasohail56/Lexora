import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { seedDefaultPlans } from "@/lib/services/subscription-service";

export async function GET() {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await seedDefaultPlans();
  const [users, plans] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        isVerified: true,
        onboardingComplete: true,
        organization: true,
        jurisdiction: true,
        barNumber: true,
        persona: true,
        practiceArea: true,
        primaryUseCase: true,
        preferredTone: true,
        avatarUrl: true,
        createdAt: true,
        subscriptions: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            trialEndsAt: true,
            cancelAtPeriodEnd: true,
            provider: true,
            plan: {
              select: {
                id: true,
                code: true,
                name: true,
                audienceRole: true,
                priceCents: true,
                billingInterval: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        audienceRole: true,
        priceCents: true,
        billingInterval: true,
      },
    }),
  ]);
  return NextResponse.json({ users, plans });
}
