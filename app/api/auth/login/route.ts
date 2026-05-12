import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { login } from "@/lib/services/auth-service";
import { setSessionCookie } from "@/lib/auth";

const Body = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const data = Body.parse(await req.json());
    const { token, user } = await login(
      data.email,
      data.password,
      req.headers.get("x-forwarded-for") || undefined,
      req.headers.get("user-agent") || undefined
    );
    await setSessionCookie(token);
    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
