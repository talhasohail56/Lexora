/**
 * Auth Service — registration, login, OTP, JWT issuance, session lifecycle.
 * Mirrors §4.2.1 of the FYP report.
 */

import { prisma } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  signSession,
  generateOTP,
  hashOTP,
  verifyOTP,
} from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";
import type { GoogleProfile } from "@/lib/google-auth";
import { auditLog } from "./audit-service";
import { createInitialSubscription } from "./subscription-service";

export async function register(
  input: { email: string; password: string; name: string; role: "USER" | "LAWYER"; planCode?: string },
  ipAddress?: string,
  userAgent?: string
) {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email already registered");

  const passwordHash = await hashPassword(input.password);
  const otp = generateOTP();
  const otpHash = await hashOTP(otp);
  const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash,
      name: input.name,
      role: input.role,
      isVerified: false,
      otpHash,
      otpExpiry,
    },
  });

  await auditLog({
    userId: user.id,
    action: "REGISTER",
    resourceType: "User",
    resourceId: user.id,
    ipAddress,
    userAgent,
  });

  await createInitialSubscription(user.id, user.role, input.planCode);

  const emailDelivery = await sendOtpEmail({ to: user.email, name: user.name, otp }).catch((error) => ({
    sent: false,
    reason: error instanceof Error ? error.message : "OTP email failed",
  }));

  return { user, otp, emailSent: emailDelivery.sent, emailError: emailDelivery.reason };
}

export async function verifyRegistrationOTP(email: string, otp: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.otpHash || !user.otpExpiry) throw new Error("Invalid request");
  if (user.otpExpiry.getTime() < Date.now()) throw new Error("OTP expired");
  const ok = await verifyOTP(otp, user.otpHash);
  if (!ok) throw new Error("Invalid OTP");
  return prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, otpHash: null, otpExpiry: null },
  });
}

export async function resendRegistrationOTP(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) throw new Error("No account found for this email");
  if (user.isVerified) throw new Error("Email is already verified");

  const otp = generateOTP();
  const otpHash = await hashOTP(otp);
  const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { otpHash, otpExpiry },
  });

  const emailDelivery = await sendOtpEmail({ to: updated.email, name: updated.name, otp }).catch((error) => ({
    sent: false,
    reason: error instanceof Error ? error.message : "OTP email failed",
  }));

  await auditLog({
    userId: updated.id,
    action: "RESEND_OTP",
    resourceType: "User",
    resourceId: updated.id,
  });

  return { user: updated, otp, emailSent: emailDelivery.sent, emailError: emailDelivery.reason };
}

export async function login(
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.passwordHash) throw new Error("Invalid credentials");
  if (user.status !== "ACTIVE") throw new Error(`Account ${user.status.toLowerCase()}`);
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new Error("Invalid credentials");
  if (!user.isVerified) throw new Error("Email not verified. Please verify via OTP.");

  const token = await signSession({
    userId: user.id,
    role: user.role as "USER" | "LAWYER" | "ADMIN",
    email: user.email,
    name: user.name,
  });

  void auditLog({
    userId: user.id,
    action: "LOGIN",
    resourceType: "User",
    resourceId: user.id,
    ipAddress,
    userAgent,
  });

  return { token, user };
}

export async function loginWithGoogle(
  profile: GoogleProfile,
  input: { role?: "USER" | "LAWYER"; planCode?: string } = {},
  ipAddress?: string,
  userAgent?: string
) {
  const email = profile.email.toLowerCase();
  const requestedRole = input.role === "LAWYER" ? "LAWYER" : "USER";
  let user = await prisma.user.findUnique({ where: { email } });
  const isNewUser = !user;

  if (user && user.status !== "ACTIVE") throw new Error(`Account ${user.status.toLowerCase()}`);

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otpHash: null,
        otpExpiry: null,
        avatarUrl: user.avatarUrl || profile.picture || null,
        name: user.name || profile.name || email.split("@")[0],
      },
    });
  } else {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: null,
        name: profile.name || email.split("@")[0],
        role: requestedRole,
        isVerified: true,
        avatarUrl: profile.picture || null,
      },
    });
    await createInitialSubscription(user.id, user.role, input.planCode);
  }

  const token = await signSession({
    userId: user.id,
    role: user.role as "USER" | "LAWYER" | "ADMIN",
    email: user.email,
    name: user.name,
  });

  void auditLog({
    userId: user.id,
    action: isNewUser ? "GOOGLE_REGISTER" : "GOOGLE_LOGIN",
    resourceType: "User",
    resourceId: user.id,
    ipAddress,
    userAgent,
    metadata: { googleSub: profile.sub },
  });

  return { token, user, isNewUser };
}

export async function logout(userId: string, ipAddress?: string, userAgent?: string) {
  await auditLog({ userId, action: "LOGOUT", ipAddress, userAgent });
}
