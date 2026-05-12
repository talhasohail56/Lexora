import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendDraftDocxEmail } from "@/lib/email";
import { auditLog } from "@/lib/services/audit-service";
import {
  WORD_MIME,
  createDraftDocxBuffer,
  draftWordFileName,
} from "@/lib/services/draft-export-service";

export const runtime = "nodejs";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [draft, user] = await Promise.all([
    prisma.draftedDocument.findFirst({ where: { id: params.id, userId: session.userId } }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true, name: true },
    }),
  ]);

  if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const buffer = await createDraftDocxBuffer({
    title: draft.title,
    content: draft.content,
    templateType: draft.templateType,
    parties: draft.parties,
    version: draft.version,
  });
  const filename = draftWordFileName(draft.title);

  const result = await sendDraftDocxEmail({
    to: user.email,
    name: user.name,
    draftTitle: draft.title,
    filename,
    buffer,
    contentType: WORD_MIME,
  });

  if (!result.sent) {
    return NextResponse.json(
      { error: result.reason || "Could not email draft", provider: result.provider },
      { status: 502 }
    );
  }

  void auditLog({
    userId: session.userId,
    action: "DRAFT_EMAIL_DOCX",
    resourceType: "DraftedDocument",
    resourceId: draft.id,
    metadata: { filename, provider: result.provider, to: user.email },
  });

  return NextResponse.json({ success: true, email: user.email, provider: result.provider });
}
