import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { logout } from "@/lib/services/auth-service";

export async function GET() {
  const s = await getSession();
  if (s) await logout(s.userId);
  clearSessionCookie();
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}

export async function POST() {
  const s = await getSession();
  if (s) await logout(s.userId);
  clearSessionCookie();
  return NextResponse.json({ success: true });
}
