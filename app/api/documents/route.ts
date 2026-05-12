import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const docs = await prisma.document.findMany({
    where: { OR: [{ userId: s.userId }, { shares: { some: { sharedWithId: s.userId } } }] },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(docs);
}
