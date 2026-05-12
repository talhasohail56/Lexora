import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { draftDocumentStoragePaths, saveVersion } from "@/lib/services/drafting-service";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const d = await prisma.draftedDocument.findFirst({ where: { id: params.id, userId: s.userId } });
  if (!d) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const document = await prisma.document.findFirst({
    where: { userId: s.userId, storagePath: { in: draftDocumentStoragePaths(params.id) } },
    select: { id: true },
  });
  return NextResponse.json({ ...d, documentId: document?.id ?? null });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { content, title } = await req.json();
  const result = await saveVersion(params.id, s.userId, content, title);
  return NextResponse.json({
    ...result.draft,
    documentId: result.document.id,
    documentName: result.document.originalName,
  });
}
