import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { auditLog } from "@/lib/services/audit-service";
import { seedDefaultPlans } from "@/lib/services/subscription-service";

const ACTIVE_SUBSCRIPTION_STATUSES = ["ACTIVE", "TRIALING", "PAST_DUE"];
const USER_ROLES = ["USER", "LAWYER", "ADMIN"];
const USER_STATUSES = ["ACTIVE", "SUSPENDED", "BANNED"];
const SUBSCRIPTION_STATUSES = ["TRIALING", "ACTIVE", "PAST_DUE", "CANCELED", "EXPIRED"];

function addDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function cleanString(value: unknown, max = 200) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function roleScopeFor(planAudience: string, role: string) {
  if (planAudience !== "ALL") return planAudience;
  return role === "ADMIN" || role === "LAWYER" ? role : "USER";
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await seedDefaultPlans();
  const body = await req.json();
  const before = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      subscriptions: {
        include: { plan: true },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });
  if (!before) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const role = typeof body.role === "string" ? body.role.toUpperCase() : undefined;
  const status = typeof body.status === "string" ? body.status.toUpperCase() : undefined;
  const subscriptionStatus = typeof body.subscriptionStatus === "string" ? body.subscriptionStatus.toUpperCase() : undefined;
  const planCode = typeof body.planCode === "string" ? body.planCode.toUpperCase() : undefined;

  if (role && !USER_ROLES.includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  if (status && !USER_STATUSES.includes(status)) return NextResponse.json({ error: "Invalid account status" }, { status: 400 });
  if (subscriptionStatus && !SUBSCRIPTION_STATUSES.includes(subscriptionStatus)) {
    return NextResponse.json({ error: "Invalid subscription status" }, { status: 400 });
  }

  const userData: Record<string, unknown> = {};
  if (role) userData.role = role;
  if (status) userData.status = status;
  if (typeof body.isVerified === "boolean") userData.isVerified = body.isVerified;
  if (typeof body.onboardingComplete === "boolean") userData.onboardingComplete = body.onboardingComplete;

  const stringFields = [
    "name",
    "organization",
    "jurisdiction",
    "barNumber",
    "persona",
    "practiceArea",
    "primaryUseCase",
    "preferredTone",
    "avatarUrl",
  ];
  for (const field of stringFields) {
    if (field in body) userData[field] = cleanString(body[field], field === "avatarUrl" ? 1000 : 240);
  }
  if ("email" in body && typeof body.email === "string") {
    const email = body.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    userData.email = email;
  }

  const finalRole = (userData.role as string | undefined) ?? before.role;
  let changedPlan: { from?: string; to: string; subscriptionId: string } | null | any = null;

  let updated;
  try {
    updated = await prisma.$transaction(async (tx) => {
    if (Object.keys(userData).length) {
      await tx.user.update({ where: { id: params.id }, data: userData });
    }

    if (planCode) {
      const plan = await tx.plan.findFirst({ where: { code: planCode, isActive: true } });
      if (!plan) throw new Error("Plan not found");

      await tx.subscription.updateMany({
        where: { userId: params.id, status: { in: ACTIVE_SUBSCRIPTION_STATUSES } },
        data: { status: "CANCELED", cancelAtPeriodEnd: true },
      });

      const nextStatus = subscriptionStatus ?? (plan.code === "LAWYER_TRIAL" ? "TRIALING" : "ACTIVE");
      const sub = await tx.subscription.create({
        data: {
          userId: params.id,
          planId: plan.id,
          status: nextStatus,
          roleScope: roleScopeFor(plan.audienceRole, finalRole),
          currentPeriodStart: new Date(),
          currentPeriodEnd: addDays(nextStatus === "TRIALING" ? 14 : 30),
          trialEndsAt: nextStatus === "TRIALING" ? addDays(14) : null,
          cancelAtPeriodEnd: false,
          provider: "ADMIN_OVERRIDE",
        },
        include: { plan: true },
      });
      changedPlan = { from: before.subscriptions[0]?.plan.code, to: plan.code, subscriptionId: sub.id };
    } else if (subscriptionStatus) {
      const current = before.subscriptions[0];
      if (!current) throw new Error("No subscription to update. Assign a plan first.");
      await tx.subscription.update({
        where: { id: current.id },
        data: {
          status: subscriptionStatus,
          cancelAtPeriodEnd: ["CANCELED", "EXPIRED"].includes(subscriptionStatus),
          currentPeriodEnd: ["CANCELED", "EXPIRED"].includes(subscriptionStatus) ? new Date() : current.currentPeriodEnd,
        },
      });
    }

    return tx.user.findUnique({
      where: { id: params.id },
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
            currentPeriodEnd: true,
            trialEndsAt: true,
            cancelAtPeriodEnd: true,
            provider: true,
            plan: { select: { id: true, code: true, name: true, audienceRole: true, priceCents: true, billingInterval: true } },
          },
        },
      },
    });
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Admin update failed" },
      { status: 400 }
    );
  }

  if (role && role !== before.role) {
    await auditLog({ userId: s.userId, action: "ROLE_CHANGE", resourceType: "User", resourceId: params.id, metadata: { from: before.role, to: role } });
  }
  if (status && status !== before.status) {
    await auditLog({ userId: s.userId, action: "STATUS_CHANGE", resourceType: "User", resourceId: params.id, metadata: { from: before.status, to: status } });
  }
  if (changedPlan) {
    await auditLog({
      userId: s.userId,
      action: "ADMIN_SUBSCRIPTION_CHANGE",
      resourceType: "Subscription",
      resourceId: changedPlan.subscriptionId,
      metadata: { userId: params.id, from: changedPlan.from, to: changedPlan.to, status: subscriptionStatus ?? "ACTIVE" },
    });
  }
  if (Object.keys(userData).some((key) => !["role", "status"].includes(key))) {
    await auditLog({ userId: s.userId, action: "ADMIN_USER_PROFILE_UPDATE", resourceType: "User", resourceId: params.id });
  }

  return NextResponse.json(updated);
}
