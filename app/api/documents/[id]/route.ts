import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteDocument } from "@/lib/services/document-service";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const doc = await prisma.document.findFirst({
    where: { id: params.id, OR: [{ userId: s.userId }, { shares: { some: { sharedWithId: s.userId } } }] },
    include: {
      clauses: true,
      risks: true,
      _count: { select: { embeddings: true } },
    },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await deleteDocument(params.id, s.userId);
  return NextResponse.json({ success: true });
}
