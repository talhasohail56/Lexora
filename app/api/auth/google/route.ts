import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createGoogleAuthorizationUrl, getGoogleOAuthConfig } from "@/lib/google-auth";

const STATE_COOKIE = "lexora_google_state";
const ROLE_COOKIE = "lexora_google_role";
const PLAN_COOKIE = "lexora_google_plan";
const NEXT_COOKIE = "lexora_google_next";

function oauthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 10 * 60,
  };
}

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const config = getGoogleOAuthConfig(origin);
  if (!config.isConfigured) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", req.url));
  }

  const role = req.nextUrl.searchParams.get("role") === "LAWYER" ? "LAWYER" : "USER";
  const plan = req.nextUrl.searchParams.get("plan")?.toUpperCase() || "";
  const next = req.nextUrl.searchParams.get("next") || "";
  const state = randomBytes(24).toString("base64url");
  const response = NextResponse.redirect(createGoogleAuthorizationUrl(state, origin));

  response.cookies.set(STATE_COOKIE, state, oauthCookieOptions());
  response.cookies.set(ROLE_COOKIE, role, oauthCookieOptions());
  if (plan) response.cookies.set(PLAN_COOKIE, plan, oauthCookieOptions());
  if (next.startsWith("/")) response.cookies.set(NEXT_COOKIE, next, oauthCookieOptions());

  return response;
}
