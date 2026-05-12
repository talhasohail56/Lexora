import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/services/notification-service";
import { auditLog } from "@/lib/services/audit-service";
import { consumeFeature, subscriptionError } from "@/lib/services/subscription-service";

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (s.role !== "LAWYER" && s.role !== "ADMIN") {
    return NextResponse.json({ error: "Only Lawyers and Admins can annotate" }, { status: 403 });
  }
  const { documentId, clauseId, content } = await req.json();
  try {
    await consumeFeature(s, "annotations", 1, { documentId, clauseId });
  } catch (e: any) {
    const out = subscriptionError(e, "annotations");
    return NextResponse.json(out.body, { status: out.status });
  }
  const doc = await prisma.document.findFirst({
    where: {
      id: documentId,
      OR: [
        { userId: s.userId },
        { shares: { some: { sharedWithId: s.userId, permission: "ANNOTATE" } } },
      ],
    },
  });
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  const a = await prisma.annotation.create({
    data: { documentId, clauseId: clauseId || null, authorId: s.userId, content },
  });
  if (doc.userId !== s.userId) {
    await createNotification({
      userId: doc.userId,
      type: "ANNOTATION_ADDED",
      title: "New annotation on your document",
      body: `${s.name} added a note: "${content.slice(0, 60)}…"`,
      resourceId: documentId,
    });
  }
  await auditLog({ userId: s.userId, action: "ANNOTATE", resourceType: "Annotation", resourceId: a.id });
  return NextResponse.json(a);
}
