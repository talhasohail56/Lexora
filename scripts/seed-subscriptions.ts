import { PrismaClient } from "@prisma/client";
import { DEFAULT_PLANS } from "../lib/subscription-config";

const prisma = new PrismaClient();

function addDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function main() {
  for (const plan of DEFAULT_PLANS) {
    await prisma.plan.upsert({
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
    });
  }

  const users = await prisma.user.findMany({
    include: { subscriptions: { where: { status: { in: ["ACTIVE", "TRIALING"] } } } },
  });

  for (const user of users) {
    if (user.role === "ADMIN" || user.subscriptions.length > 0) continue;
    const planCode = user.role === "LAWYER" ? "LAWYER" : "PRO";
    const plan = await prisma.plan.findUnique({ where: { code: planCode } });
    if (!plan) continue;
    await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        status: "ACTIVE",
        roleScope: user.role,
        currentPeriodStart: new Date(),
        currentPeriodEnd: addDays(30),
        provider: "MANUAL",
      },
    });
  }

  const counts = await Promise.all([
    prisma.plan.count(),
    prisma.subscription.count(),
    prisma.usageEvent.count(),
  ]);
  console.log({ plans: counts[0], subscriptions: counts[1], usageEvents: counts[2] });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
