import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DashboardClient } from "./client";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [statsRows, recent] = await Promise.all([
    prisma.$queryRaw<
      {
        docCount: number;
        avgRisk: number;
        notifications: number;
        chatSessions: number;
      }[]
    >`
      SELECT
        (SELECT COUNT(*)::int FROM "Document" WHERE "userId" = ${session.userId}) AS "docCount",
        (
          SELECT COALESCE(ROUND(AVG("riskScore"))::int, 0)
          FROM "Document"
          WHERE "userId" = ${session.userId} AND "status" = 'COMPLETED'
        ) AS "avgRisk",
        (SELECT COUNT(*)::int FROM "Notification" WHERE "userId" = ${session.userId} AND "isRead" = false) AS "notifications",
        (SELECT COUNT(*)::int FROM "ChatSession" WHERE "userId" = ${session.userId}) AS "chatSessions"
    `,
    prisma.$queryRaw<
      {
        id: string;
        name: string;
        status: string;
        risk: number;
        type: string;
        clauses: number;
        risks: number;
        createdAt: Date;
      }[]
    >`
      SELECT
        d."id",
        d."originalName" AS "name",
        d."status",
        COALESCE(d."riskScore", 0)::float8 AS "risk",
        COALESCE(d."documentType", 'GENERAL') AS "type",
        COALESCE(c."clauses", 0)::int AS "clauses",
        COALESCE(r."risks", 0)::int AS "risks",
        d."createdAt"
      FROM "Document" d
      LEFT JOIN (
        SELECT "documentId", COUNT(*)::int AS "clauses"
        FROM "Clause"
        GROUP BY "documentId"
      ) c ON c."documentId" = d."id"
      LEFT JOIN (
        SELECT "documentId", COUNT(*)::int AS "risks"
        FROM "Risk"
        GROUP BY "documentId"
      ) r ON r."documentId" = d."id"
      WHERE d."userId" = ${session.userId}
      ORDER BY d."createdAt" DESC
      LIMIT 5
    `,
  ]);

  const stats = statsRows[0] ?? { docCount: 0, avgRisk: 0, notifications: 0, chatSessions: 0 };

  return (
    <DashboardClient
      session={session}
      stats={stats}
      recent={recent.map((d) => ({ ...d, createdAt: d.createdAt.toISOString() }))}
    />
  );
}
