import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createGoogleAuthorizationUrl, getGoogleOAuthConfig } from "@/lib/google-auth";

const STATE_COOKIE = "lexora_google_state";
const ROLE_COOKIE = "lexora_google_role";
const PLAN_COOKIE = "lexora_google_plan";

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
  const config = getGoogleOAuthConfig();
  if (!config.isConfigured) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", req.url));
  }

  const role = req.nextUrl.searchParams.get("role") === "LAWYER" ? "LAWYER" : "USER";
  const plan = req.nextUrl.searchParams.get("plan")?.toUpperCase() || "";
  const state = randomBytes(24).toString("base64url");
  const response = NextResponse.redirect(createGoogleAuthorizationUrl(state));

  response.cookies.set(STATE_COOKIE, state, oauthCookieOptions());
  response.cookies.set(ROLE_COOKIE, role, oauthCookieOptions());
  if (plan) response.cookies.set(PLAN_COOKIE, plan, oauthCookieOptions());

  return response;
}
