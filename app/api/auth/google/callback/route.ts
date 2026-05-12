import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { exchangeGoogleCode } from "@/lib/google-auth";
import { loginWithGoogle } from "@/lib/services/auth-service";

const STATE_COOKIE = "lexora_google_state";
const ROLE_COOKIE = "lexora_google_role";
const PLAN_COOKIE = "lexora_google_plan";

function clearOAuthCookies(response: NextResponse) {
  response.cookies.set(STATE_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(ROLE_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(PLAN_COOKIE, "", { path: "/", maxAge: 0 });
}

function redirectWithError(req: NextRequest, error: string) {
  const response = NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, req.url));
  clearOAuthCookies(response);
  return response;
}

export async function GET(req: NextRequest) {
  const error = req.nextUrl.searchParams.get("error");
  if (error) return redirectWithError(req, error);

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expectedState = req.cookies.get(STATE_COOKIE)?.value;
  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectWithError(req, "google_state_mismatch");
  }

  try {
    const profile = await exchangeGoogleCode(code, req.nextUrl.origin);
    const role = req.cookies.get(ROLE_COOKIE)?.value === "LAWYER" ? "LAWYER" : "USER";
    const planCode = req.cookies.get(PLAN_COOKIE)?.value || undefined;
    const { token } = await loginWithGoogle(
      profile,
      { role, planCode },
      req.headers.get("x-forwarded-for") || undefined,
      req.headers.get("user-agent") || undefined
    );

    const response = NextResponse.redirect(new URL("/dashboard", req.url));
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    clearOAuthCookies(response);
    return response;
  } catch (e: any) {
    return redirectWithError(req, e.message || "google_login_failed");
  }
}
