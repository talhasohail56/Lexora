import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const drafts = await prisma.draftedDocument.findMany({
    where: { userId: s.userId },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(drafts);
}
