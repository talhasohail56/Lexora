import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

function isAuthorized(req: NextRequest) {
  const secret = process.env.WARMUP_SECRET || process.env.CRON_SECRET;
  if (!secret) return true;

  const auth = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");
  return auth === `Bearer ${secret}` || querySecret === secret;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  await prisma.$queryRaw`SELECT 1`;

  return NextResponse.json({
    ok: true,
    service: "lexora",
    warmed: ["next-function", "prisma-client", "postgres-connection"],
    durationMs: Date.now() - startedAt,
    at: new Date().toISOString(),
  });
}
