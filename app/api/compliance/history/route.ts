import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json([], { status: 401 });
  const documentId = new URL(req.url).searchParams.get("documentId");
  if (!documentId) return NextResponse.json([]);
  const rows = await prisma.complianceCheck.findMany({
    where: { documentId },
    orderBy: { checkedAt: "desc" },
  });
  return NextResponse.json(rows);
}
