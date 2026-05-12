import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendMessage } from "@/lib/services/chat-service";
import { consumeFeature, subscriptionError } from "@/lib/services/subscription-service";
import { z } from "zod";

const Body = z.object({
  sessionId: z.string().optional(),
  content: z.string().min(1).max(4000),
  scopeDocumentId: z.string().optional(),
  legalOnly: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const s = await getSession();
    if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const data = Body.parse(await req.json());
    await consumeFeature(s, "chatMessages", 1);
    const result = await sendMessage({ userId: s.userId, ...data });
    return NextResponse.json(result);
  } catch (e: any) {
    if (String(e.message).includes("SUBSCRIPTION") || String(e.message).includes("PLAN_") || String(e.message).includes("ROLE_")) {
      const out = subscriptionError(e, "chatMessages");
      return NextResponse.json(out.body, { status: out.status });
    }
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
