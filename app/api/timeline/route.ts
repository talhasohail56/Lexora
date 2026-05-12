import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const documentId = req.nextUrl.searchParams.get("documentId") || undefined;
  const events = await prisma.timelineEvent.findMany({
    where: {
      document: { userId: s.userId },
      ...(documentId ? { documentId } : {}),
    },
    orderBy: { eventDate: "asc" },
    take: 200,
    include: { document: { select: { id: true, originalName: true } } },
  });
  return NextResponse.json(events);
}
