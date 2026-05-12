import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DashboardClient } from "./client";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [docCount, doneDocs, recent, notifications, sessions] = await Promise.all([
    prisma.document.count({ where: { userId: session.userId } }),
    prisma.document.findMany({
      where: { userId: session.userId, status: "COMPLETED" },
      select: { riskScore: true },
    }),
    prisma.document.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { clauses: true, risks: true } } },
    }),
    prisma.notification.count({ where: { userId: session.userId, isRead: false } }),
    prisma.chatSession.count({ where: { userId: session.userId } }),
  ]);

  const avgRisk =
    doneDocs.length === 0
      ? 0
      : Math.round(doneDocs.reduce((s, d) => s + (d.riskScore || 0), 0) / doneDocs.length);

  return (
    <DashboardClient
      session={session}
      stats={{ docCount, avgRisk, notifications, chatSessions: sessions }}
      recent={recent.map((d) => ({
        id: d.id,
        name: d.originalName,
        status: d.status,
        risk: d.riskScore || 0,
        type: d.documentType || "GENERAL",
        clauses: d._count.clauses,
        risks: d._count.risks,
        createdAt: d.createdAt.toISOString(),
      }))}
    />
  );
}
