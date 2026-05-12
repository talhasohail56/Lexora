import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { sendFirmInvitationEmail } from "@/lib/email";
import { auditLog } from "./audit-service";
import { createNotification } from "./notification-service";

const INVITE_DAYS = 14;

function addDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function canManageFirm(role?: string | null) {
  return role === "OWNER" || role === "ADMIN";
}

export async function getActiveFirmMembership(userId: string) {
  return prisma.firmMember.findFirst({
    where: { userId, status: "ACTIVE" },
    include: { firm: true },
    orderBy: { joinedAt: "asc" },
  });
}

export async function getTeamWorkspace(userId: string) {
  const membership = await getActiveFirmMembership(userId);
  if (!membership) return null;

  const firm = await prisma.firm.findUnique({
    where: { id: membership.firmId },
    include: {
      owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
      members: {
        where: { status: "ACTIVE" },
        include: {
          user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true, createdAt: true } },
        },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
      },
      invitations: {
        where: { status: "PENDING" },
        include: { invitedBy: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!firm) return null;
  const firmPlanActive = await userHasFirmPlan(firm.ownerId);

  return {
    firm,
    membership,
    firmPlanActive,
    canManage: firmPlanActive && canManageFirm(membership.role),
  };
}

export async function userHasFirmPlan(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "TRIALING"] },
      currentPeriodEnd: { gt: new Date() },
      plan: { code: "FIRM" },
    },
    include: { plan: true },
  });
  return Boolean(subscription);
}

export async function createFirmWorkspace(input: { userId: string; name: string }) {
  const hasPlan = await userHasFirmPlan(input.userId);
  if (!hasPlan) throw new Error("Firm workspace requires the Firm plan");
  const existing = await getActiveFirmMembership(input.userId);
  if (existing) throw new Error("You are already part of a firm workspace");

  const firm = await prisma.firm.create({
    data: {
      name: input.name,
      ownerId: input.userId,
      members: {
        create: {
          userId: input.userId,
          role: "OWNER",
        },
      },
    },
  });

  void auditLog({
    userId: input.userId,
    action: "FIRM_CREATED",
    resourceType: "Firm",
    resourceId: firm.id,
    metadata: { name: firm.name },
  });

  return firm;
}

export async function inviteFirmMember(input: {
  firmId: string;
  invitedById: string;
  invitedByName: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  appUrl?: string;
}) {
  const normalizedEmail = input.email.toLowerCase().trim();
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    const existingMembership = await prisma.firmMember.findUnique({
      where: { firmId_userId: { firmId: input.firmId, userId: existingUser.id } },
    });
    if (existingMembership?.status === "ACTIVE") throw new Error("This user is already in the firm");
  }

  const firm = await prisma.firm.findUnique({ where: { id: input.firmId } });
  if (!firm) throw new Error("Firm not found");
  if (!(await userHasFirmPlan(firm.ownerId))) {
    throw new Error("Firm workspace is paused. Upgrade the firm owner back to the Firm plan to invite members.");
  }

  await prisma.firmInvitation.updateMany({
    where: { firmId: input.firmId, email: normalizedEmail, status: "PENDING" },
    data: { status: "REVOKED" },
  });

  const invitation = await prisma.firmInvitation.create({
    data: {
      firmId: input.firmId,
      email: normalizedEmail,
      role: input.role,
      token: randomBytes(32).toString("base64url"),
      invitedById: input.invitedById,
      expiresAt: addDays(INVITE_DAYS),
    },
  });

  const emailDelivery = await sendFirmInvitationEmail({
    to: normalizedEmail,
    firmName: firm.name,
    inviterName: input.invitedByName,
    token: invitation.token,
    appUrl: input.appUrl,
  }).catch((error) => ({
    sent: false,
    reason: error instanceof Error ? error.message : "Invitation email failed",
  }));

  void auditLog({
    userId: input.invitedById,
    action: "FIRM_INVITE_SENT",
    resourceType: "Firm",
    resourceId: input.firmId,
    metadata: { email: normalizedEmail, role: input.role, emailSent: emailDelivery.sent },
  });

  return { invitation, emailSent: emailDelivery.sent, emailError: emailDelivery.reason };
}

export async function acceptFirmInvitation(token: string, userId: string) {
  const invitation = await prisma.firmInvitation.findUnique({
    where: { token },
    include: { firm: true, invitedBy: { select: { id: true, name: true } } },
  });
  if (!invitation) throw new Error("Invitation not found");
  if (!(await userHasFirmPlan(invitation.firm.ownerId))) {
    throw new Error("Firm workspace is paused. Ask the firm owner to reactivate the Firm plan.");
  }
  if (invitation.status !== "PENDING") throw new Error("Invitation is no longer active");
  if (invitation.expiresAt.getTime() < Date.now()) {
    await prisma.firmInvitation.update({ where: { id: invitation.id }, data: { status: "EXPIRED" } });
    throw new Error("Invitation expired");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    throw new Error(`This invitation is for ${invitation.email}. Sign in with that email to accept it.`);
  }

  await prisma.$transaction([
    prisma.firmMember.upsert({
      where: { firmId_userId: { firmId: invitation.firmId, userId } },
      update: { role: invitation.role, status: "ACTIVE" },
      create: { firmId: invitation.firmId, userId, role: invitation.role },
    }),
    prisma.firmInvitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED", acceptedById: userId },
    }),
    prisma.notification.create({
      data: {
        userId,
        type: "FIRM_INVITE_ACCEPTED",
        title: `Joined ${invitation.firm.name}`,
        body: "You now have access to documents shared with the firm.",
        resourceId: invitation.firmId,
        priority: "MEDIUM",
      },
    }),
  ]);

  await createNotification({
    userId: invitation.invitedById,
    type: "FIRM_MEMBER_JOINED",
    title: `${user.name} joined ${invitation.firm.name}`,
    body: `${user.email} accepted the firm workspace invitation.`,
    resourceId: invitation.firmId,
  });

  void auditLog({
    userId,
    action: "FIRM_INVITE_ACCEPTED",
    resourceType: "Firm",
    resourceId: invitation.firmId,
    metadata: { email: user.email },
  });

  return invitation.firm;
}
