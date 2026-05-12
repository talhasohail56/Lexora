import { prisma } from "@/lib/db";
import { safeJson } from "@/lib/utils";
import {
  ALWAYS_AVAILABLE_FEATURES,
  DEFAULT_PLANS,
  FEATURE_LABELS,
  type AppRole,
  type PlanLimitMap,
  type SubscriptionContext,
  type SubscriptionFeature,
  canRoleUseFeature,
  getPlanLimit,
  isActiveStatus,
  isLimitUnlimited,
} from "@/lib/subscription-config";
import { auditLog } from "./audit-service";

const ACTIVE_STATUSES = ["ACTIVE", "TRIALING"];

function addDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function normalizeRole(role: string): AppRole {
  return role === "ADMIN" || role === "LAWYER" ? role : "USER";
}

function serializePlan(plan: any) {
  return {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    description: plan.description,
    audienceRole: plan.audienceRole as AppRole | "ALL",
    priceCents: plan.priceCents,
    billingInterval: plan.billingInterval,
    features: safeJson<SubscriptionFeature[]>(plan.features, []),
    limits: safeJson<PlanLimitMap>(plan.limits, {}),
    isActive: plan.isActive,
    sortOrder: plan.sortOrder,
  };
}

export async function seedDefaultPlans() {
  await Promise.all(
    DEFAULT_PLANS.map((plan) =>
      prisma.plan.upsert({
        where: { code: plan.code },
        update: {
          name: plan.name,
          description: plan.description,
          audienceRole: plan.audienceRole,
          priceCents: plan.priceCents,
          billingInterval: plan.billingInterval,
          features: JSON.stringify(plan.features),
          limits: JSON.stringify(plan.limits),
          isActive: true,
          sortOrder: plan.sortOrder,
        },
        create: {
          code: plan.code,
          name: plan.name,
          description: plan.description,
          audienceRole: plan.audienceRole,
          priceCents: plan.priceCents,
          billingInterval: plan.billingInterval,
          features: JSON.stringify(plan.features),
          limits: JSON.stringify(plan.limits),
          isActive: true,
          sortOrder: plan.sortOrder,
        },
      })
    )
  );
}

export async function listPlans() {
  await seedDefaultPlans();
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return plans.map(serializePlan);
}

export async function createInitialSubscription(userId: string, role: string, requestedPlanCode?: string) {
  await seedDefaultPlans();
  const normalizedRole = normalizeRole(role);
  const fallbackCode = normalizedRole === "LAWYER" ? "LAWYER_TRIAL" : "STARTER";
  const requested = requestedPlanCode?.toUpperCase();
  const plan =
    (requested
      ? await prisma.plan.findFirst({
          where: {
            code: requested,
            isActive: true,
            OR: [{ audienceRole: normalizedRole }, { audienceRole: "ALL" }],
          },
        })
      : null) ??
    (await prisma.plan.findUnique({ where: { code: fallbackCode } }));
  if (!plan) throw new Error("Subscription plan not configured");

  const now = new Date();
  const isTrial = plan.code === "LAWYER_TRIAL";
  return prisma.subscription.create({
    data: {
      userId,
      planId: plan.id,
      status: isTrial ? "TRIALING" : "ACTIVE",
      roleScope: plan.audienceRole === "ALL" ? normalizedRole : plan.audienceRole,
      currentPeriodStart: now,
      currentPeriodEnd: isTrial ? addDays(14) : addDays(30),
      trialEndsAt: isTrial ? addDays(14) : null,
      provider: "MANUAL",
    },
    include: { plan: true },
  });
}

export async function ensureSubscriptionForUser(userId: string, role: string) {
  await seedDefaultPlans();
  const current = await prisma.subscription.findFirst({
    where: { userId, status: { in: ACTIVE_STATUSES } },
    include: { plan: true },
    orderBy: { currentPeriodEnd: "desc" },
  });

  if (current) {
    if (current.currentPeriodEnd.getTime() < Date.now() && current.plan.code !== "STARTER") {
      await prisma.subscription.update({
        where: { id: current.id },
        data: { status: "EXPIRED" },
      });
      return createInitialSubscription(userId, role);
    }
    return current;
  }

  return createInitialSubscription(userId, role);
}

export async function getSubscriptionContext(userId: string, role: string): Promise<SubscriptionContext> {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "ADMIN") {
    const firm = DEFAULT_PLANS.find((p) => p.code === "FIRM")!;
    return {
      isAdmin: true,
      role: "ADMIN",
      status: "ACTIVE",
      currentPeriodEnd: null,
      trialEndsAt: null,
      cancelAtPeriodEnd: false,
      plan: {
        code: firm.code,
        name: firm.name,
        audienceRole: firm.audienceRole,
        priceCents: firm.priceCents,
        billingInterval: firm.billingInterval,
        features: firm.features,
        limits: firm.limits,
      },
      usage: {},
    };
  }

  const subscription = await ensureSubscriptionForUser(userId, normalizedRole);
  const plan = serializePlan(subscription.plan);
  const usageRows = await prisma.usageEvent.groupBy({
    by: ["feature"],
    where: {
      userId,
      createdAt: { gte: subscription.currentPeriodStart, lte: subscription.currentPeriodEnd },
    },
    _sum: { quantity: true },
  });

  const usage = usageRows.reduce<SubscriptionContext["usage"]>((acc, row) => {
    acc[row.feature as SubscriptionFeature] = row._sum.quantity ?? 0;
    return acc;
  }, {});

  return {
    isAdmin: false,
    role: normalizedRole,
    status: subscription.status as SubscriptionContext["status"],
    currentPeriodEnd: subscription.currentPeriodEnd,
    trialEndsAt: subscription.trialEndsAt,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    plan,
    usage,
  };
}

export function assertFeatureAccess(ctx: SubscriptionContext, feature: SubscriptionFeature, quantity = 1) {
  if (ctx.isAdmin) return;
  if (ALWAYS_AVAILABLE_FEATURES.includes(feature)) return;
  if (!isActiveStatus(ctx.status)) throw new Error("SUBSCRIPTION_INACTIVE");
  if (!canRoleUseFeature(ctx.role, feature)) throw new Error("ROLE_UPGRADE_REQUIRED");
  if (!ctx.plan.features.includes(feature)) throw new Error("PLAN_UPGRADE_REQUIRED");

  const limit = getPlanLimit(ctx, feature);
  if (isLimitUnlimited(limit)) return;
  if (typeof limit === "number" && (ctx.usage[feature] ?? 0) + quantity > limit) {
    throw new Error("PLAN_LIMIT_REACHED");
  }
  if (limit === false) throw new Error("PLAN_UPGRADE_REQUIRED");
}

export async function requireFeature(user: { userId: string; role: string }, feature: SubscriptionFeature, quantity = 1) {
  const ctx = await getSubscriptionContext(user.userId, user.role);
  assertFeatureAccess(ctx, feature, quantity);
  return ctx;
}

export async function trackUsage(userId: string, feature: SubscriptionFeature, quantity = 1, metadata?: Record<string, unknown>) {
  if (ALWAYS_AVAILABLE_FEATURES.includes(feature)) return;
  await prisma.usageEvent.create({
    data: {
      userId,
      feature,
      quantity,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

export async function consumeFeature(
  user: { userId: string; role: string },
  feature: SubscriptionFeature,
  quantity = 1,
  metadata?: Record<string, unknown>
) {
  const ctx = await requireFeature(user, feature, quantity);
  await trackUsage(user.userId, feature, quantity, metadata);
  return ctx;
}

export function subscriptionError(error: unknown, feature: SubscriptionFeature) {
  const message = error instanceof Error ? error.message : "SUBSCRIPTION_REQUIRED";
  const featureName = FEATURE_LABELS[feature];
  const status =
    message === "ROLE_UPGRADE_REQUIRED" ? 403 :
    message === "PLAN_LIMIT_REACHED" ? 402 :
    message === "PLAN_UPGRADE_REQUIRED" ? 402 :
    message === "SUBSCRIPTION_INACTIVE" ? 402 :
    400;

  const copy =
    message === "ROLE_UPGRADE_REQUIRED" ? `${featureName} requires a lawyer seat.` :
    message === "PLAN_LIMIT_REACHED" ? `${featureName} limit reached for this billing period.` :
    message === "SUBSCRIPTION_INACTIVE" ? "Your subscription is inactive. Update billing to continue." :
    `${featureName} is not included in your current plan.`;

  return { status, body: { error: copy, code: message, feature } };
}

export async function switchPlan(userId: string, role: string, planCode: string, actorId?: string) {
  await seedDefaultPlans();
  const normalizedRole = normalizeRole(role);
  const plan = await prisma.plan.findFirst({
    where: {
      code: planCode.toUpperCase(),
      isActive: true,
      OR: [{ audienceRole: normalizedRole }, { audienceRole: "ALL" }],
    },
  });
  if (!plan) throw new Error("Plan not available for this role");

  await prisma.subscription.updateMany({
    where: { userId, status: { in: ACTIVE_STATUSES } },
    data: { status: "CANCELED", cancelAtPeriodEnd: true },
  });

  const sub = await prisma.subscription.create({
    data: {
      userId,
      planId: plan.id,
      status: "ACTIVE",
      roleScope: plan.audienceRole === "ALL" ? normalizedRole : plan.audienceRole,
      currentPeriodStart: new Date(),
      currentPeriodEnd: addDays(30),
      provider: "MANUAL",
    },
    include: { plan: true },
  });

  await auditLog({
    userId: actorId ?? userId,
    action: "SUBSCRIPTION_CHANGE",
    resourceType: "Subscription",
    resourceId: sub.id,
    metadata: { userId, planCode: plan.code, provider: "MANUAL" },
  });

  return sub;
}

export async function cancelSubscription(userId: string) {
  const sub = await prisma.subscription.findFirst({
    where: { userId, status: { in: ACTIVE_STATUSES } },
    orderBy: { currentPeriodEnd: "desc" },
  });
  if (!sub) throw new Error("No active subscription");
  return prisma.subscription.update({
    where: { id: sub.id },
    data: { cancelAtPeriodEnd: true },
  });
}

export async function listUserSubscriptions() {
  await seedDefaultPlans();
  return prisma.subscription.findMany({
    include: {
      user: { select: { id: true, email: true, name: true, role: true, status: true } },
      plan: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });
}
