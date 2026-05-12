import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyRegistrationOTP } from "@/lib/services/auth-service";

const Body = z.object({ email: z.string().email(), otp: z.string().length(6) });

export async function POST(req: NextRequest) {
  try {
    const data = Body.parse(await req.json());
    await verifyRegistrationOTP(data.email, data.otp);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
