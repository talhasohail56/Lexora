import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { CHAT_DRAFT_TYPES, generateDraftFromChat } from "@/lib/services/drafting-service";
import { consumeFeature, subscriptionError } from "@/lib/services/subscription-service";

const Body = z.object({
  documentType: z.enum(Object.keys(CHAT_DRAFT_TYPES) as [keyof typeof CHAT_DRAFT_TYPES, ...(keyof typeof CHAT_DRAFT_TYPES)[]]),
  title: z.string().min(1).max(200),
  instructions: z.string().max(2000).optional(),
});

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = Body.parse(await req.json());
    await consumeFeature(session, "drafts", 1, {
      source: "chat",
      sessionId: params.id,
      documentType: data.documentType,
    });
    const draft = await generateDraftFromChat({
      userId: session.userId,
      sessionId: params.id,
      documentType: data.documentType,
      title: data.title,
      instructions: data.instructions,
    });

    return NextResponse.json({
      id: draft.id,
      title: draft.title,
      templateType: draft.templateType,
      content: draft.content,
      openUrl: `/draft?draft=${draft.id}`,
    });
  } catch (error: any) {
    if (String(error.message).includes("SUBSCRIPTION") || String(error.message).includes("PLAN_") || String(error.message).includes("ROLE_")) {
      const out = subscriptionError(error, "drafts");
      return NextResponse.json(out.body, { status: out.status });
    }
    return NextResponse.json({ error: error.message || "Could not create draft from chat" }, { status: 400 });
  }
}
