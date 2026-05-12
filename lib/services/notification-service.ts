/**
 * Notification Service — in-app notifications.
 * Mirrors §4.2.8 of the FYP report.
 */

import { prisma } from "@/lib/db";

export async function createNotification(input: {
  userId: string;
  type: string;
  title: string;
  body: string;
  resourceId?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      resourceId: input.resourceId,
      priority: input.priority || "MEDIUM",
    },
  });
}

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    take: 100,
  });
}

export async function markRead(id: string, userId: string) {
  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
}

export async function unreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}
