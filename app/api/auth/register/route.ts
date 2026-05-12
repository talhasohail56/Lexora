import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { register } from "@/lib/services/auth-service";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2).max(80),
  role: z.enum(["USER", "LAWYER"]),
  planCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const data = Body.parse(json);
    const { otp, emailSent, emailError } = await register(
      data,
      req.headers.get("x-forwarded-for") || undefined,
      req.headers.get("user-agent") || undefined
    );
    return NextResponse.json({
      success: true,
      emailSent,
      emailError: emailSent ? undefined : emailError,
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
