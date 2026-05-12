import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED = [
  "/dashboard", "/documents", "/chat", "/search", "/draft", "/compliance",
  "/compare", "/timeline", "/notifications", "/admin", "/settings",
  "/billing", "/team", "/negotiator", "/forecast", "/glossary", "/library", "/voice-brief", "/annotations",
];
const ADMIN_ONLY = ["/admin"];
const AUTHENTICATED_REDIRECTS = ["/", "/login", "/register"];

async function verify(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "lexora-dev-secret");
    const { payload } = await jwtVerify(token, secret);
    return payload as any;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("lexora_session")?.value;
  const payload = token ? await verify(token) : null;

  if (payload && AUTHENTICATED_REDIRECTS.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const needsAuth = PROTECTED.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  if (!token) return NextResponse.redirect(new URL("/login", req.url));
  if (!payload) return NextResponse.redirect(new URL("/login", req.url));

  if (ADMIN_ONLY.some((p) => pathname.startsWith(p)) && payload.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
