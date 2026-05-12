import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./db";

const COOKIE = "lexora_session";
export const SESSION_COOKIE = COOKIE;
const secret = () => new TextEncoder().encode(process.env.JWT_SECRET || "lexora-dev-secret");
const DEFAULT_SESSION_DAYS = 90;

export type SessionPayload = {
  userId: string;
  role: "USER" | "LAWYER" | "ADMIN";
  email: string;
  name: string;
};

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}
export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function signSession(payload: SessionPayload) {
  const maxAge = sessionMaxAgeSeconds();
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(secret());
}

export function sessionMaxAgeSeconds() {
  const days = Number(process.env.SESSION_MAX_AGE_DAYS || DEFAULT_SESSION_DAYS);
  const safeDays = Number.isFinite(days) && days > 0 ? days : DEFAULT_SESSION_DAYS;
  return Math.round(safeDays * 24 * 60 * 60);
}

export function sessionCookieOptions() {
  const maxAge = sessionMaxAgeSeconds();
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    expires: new Date(Date.now() + maxAge * 1000),
  };
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  cookies().set(COOKIE, token, sessionCookieOptions());
}

export function clearSessionCookie() {
  cookies().set(COOKIE, "", { path: "/", maxAge: 0 });
}

export async function getSession(): Promise<SessionPayload | null> {
  const c = cookies().get(COOKIE);
  if (!c?.value) return null;
  return verifySession(c.value);
}

export async function requireSession(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHORIZED");
  return s;
}

export async function requireRole(roles: SessionPayload["role"][]): Promise<SessionPayload> {
  const s = await requireSession();
  if (!roles.includes(s.role)) throw new Error("FORBIDDEN");
  return s;
}

export async function getCurrentUser() {
  const s = await getSession();
  if (!s) return null;
  return prisma.user.findUnique({ where: { id: s.userId } });
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashOTP(otp: string) {
  return bcrypt.hash(otp, 8);
}

export async function verifyOTP(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}
