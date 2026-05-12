import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED = [
  "/dashboard", "/documents", "/chat", "/search", "/draft", "/compliance",
  "/compare", "/timeline", "/notifications", "/admin", "/settings",
  "/billing", "/negotiator", "/forecast", "/glossary", "/library", "/voice-brief", "/annotations",
];
const ADMIN_ONLY = ["/admin"];

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
  const needsAuth = PROTECTED.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  const token = req.cookies.get("lexora_session")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));
  const payload = await verify(token);
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
