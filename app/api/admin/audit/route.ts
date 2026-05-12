import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") return NextResponse.json([], { status: 403 });
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "asc" },
    take: 1000,
  });
  return NextResponse.json(logs);
}
