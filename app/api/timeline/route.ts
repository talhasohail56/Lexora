import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const events = await prisma.timelineEvent.findMany({
    where: { document: { userId: s.userId } },
    orderBy: { eventDate: "asc" },
    take: 200,
  });
  return NextResponse.json(events);
}
