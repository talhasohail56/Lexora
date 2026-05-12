import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateDraft } from "@/lib/services/drafting-service";
import { consumeFeature, subscriptionError } from "@/lib/services/subscription-service";
import { z } from "zod";

const Body = z.object({
  templateType: z.enum(["NDA", "EMPLOYMENT", "RENTAL", "SERVICE", "PARTNERSHIP"]),
  title: z.string().min(1).max(200),
  parties: z.record(z.any()),
});

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const data = Body.parse(await req.json());
    await consumeFeature(s, "drafts", 1, { templateType: data.templateType });
    const draft = await generateDraft({ userId: s.userId, ...data });
    return NextResponse.json({ id: draft.id, content: draft.content });
  } catch (e: any) {
    if (String(e.message).includes("SUBSCRIPTION") || String(e.message).includes("PLAN_") || String(e.message).includes("ROLE_")) {
      const out = subscriptionError(e, "drafts");
      return NextResponse.json(out.body, { status: out.status });
    }
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
