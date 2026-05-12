import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rules = await prisma.complianceRule.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(rules);
}

const Body = z.object({
  name: z.string().min(2),
  description: z.string().min(2),
  category: z.string(),
  jurisdiction: z.string().optional(),
  rulePattern: z.string().optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  requiresLLM: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const data = Body.parse(await req.json());
  const rule = await prisma.complianceRule.create({
    data: { ...data, createdBy: s.userId, isActive: true },
  });
  return NextResponse.json(rule);
}
