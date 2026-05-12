import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTeamWorkspace } from "@/lib/services/team-service";
import { createNotification } from "@/lib/services/notification-service";
import { auditLog } from "@/lib/services/audit-service";

const ShareBody = z.object({
  scope: z.enum(["MEMBER", "TEAM"]),
  memberId: z.string().optional(),
  permission: z.enum(["VIEW_ONLY", "ANNOTATE"]).default("VIEW_ONLY"),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = ShareBody.parse(await req.json());
    const doc = await prisma.document.findFirst({ where: { id: params.id, userId: session.userId } });
    if (!doc) return NextResponse.json({ error: "Only the document owner can share this document" }, { status: 403 });

    const workspace = await getTeamWorkspace(session.userId);
    if (!workspace) return NextResponse.json({ error: "Create or join a firm workspace before sharing" }, { status: 400 });

    const targetMembers = data.scope === "TEAM"
      ? workspace.firm.members.filter((member: any) => member.userId !== session.userId)
      : workspace.firm.members.filter((member: any) => member.userId === data.memberId && member.userId !== session.userId);

    if (!targetMembers.length) {
      return NextResponse.json({ error: "No eligible team members found" }, { status: 400 });
    }

    const shares = await Promise.all(
      targetMembers.map((member: any) =>
        prisma.documentShare.upsert({
          where: { documentId_sharedWithId: { documentId: doc.id, sharedWithId: member.userId } },
          update: { permission: data.permission, sharedById: session.userId },
          create: {
            documentId: doc.id,
            sharedById: session.userId,
            sharedWithId: member.userId,
            permission: data.permission,
          },
        })
      )
    );

    await Promise.all(
      targetMembers.map((member: any) =>
        createNotification({
          userId: member.userId,
          type: "DOCUMENT_SHARED",
          title: "Document shared with you",
          body: `${session.name} shared "${doc.originalName}" with you.`,
          resourceId: doc.id,
        })
      )
    );

    void auditLog({
      userId: session.userId,
      action: "DOCUMENT_SHARED",
      resourceType: "Document",
      resourceId: doc.id,
      metadata: { scope: data.scope, count: shares.length, permission: data.permission },
    });

    return NextResponse.json({ success: true, shares });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Could not share document" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shareId } = await req.json().catch(() => ({ shareId: "" }));
  if (!shareId) return NextResponse.json({ error: "shareId required" }, { status: 400 });

  const doc = await prisma.document.findFirst({ where: { id: params.id, userId: session.userId } });
  if (!doc) return NextResponse.json({ error: "Only the document owner can revoke sharing" }, { status: 403 });

  await prisma.documentShare.deleteMany({ where: { id: shareId, documentId: params.id } });
  return NextResponse.json({ success: true });
}
