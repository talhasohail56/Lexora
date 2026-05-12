import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resendRegistrationOTP } from "@/lib/services/auth-service";

const Body = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    const data = Body.parse(await req.json());
    const result = await resendRegistrationOTP(data.email);
    return NextResponse.json({
      success: true,
      emailSent: result.emailSent,
      emailError: result.emailSent ? undefined : result.emailError,
      devOtp: process.env.NODE_ENV !== "production" ? result.otp : undefined,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
