import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") return NextResponse.json([], { status: 403 });
  const t = await prisma.legalTemplate.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(t);
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const t = await prisma.legalTemplate.create({ data: { ...body, createdBy: s.userId } });
  return NextResponse.json(t);
}
