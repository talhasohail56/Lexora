import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DocumentDetailClient } from "./client";
import { getTeamWorkspace } from "@/lib/services/team-service";

export default async function DocPage({ params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) redirect("/login");

  const doc = await prisma.document.findFirst({
    where: { id: params.id, OR: [{ userId: s.userId }, { shares: { some: { sharedWithId: s.userId } } }] },
    include: {
      user: { select: { id: true, name: true, email: true } },
      shares: {
        include: {
          sharedWith: { select: { id: true, name: true, email: true, avatarUrl: true } },
          sharedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      clauses: { orderBy: { createdAt: "asc" } },
      risks: { orderBy: { severity: "asc" } },
      timelineEvents: { orderBy: { eventDate: "asc" } },
      annotations: { include: { author: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      _count: { select: { embeddings: true } },
    },
  });
  if (!doc) redirect("/documents");
  const visibleDoc = doc.userId === s.userId
    ? doc
    : { ...doc, shares: doc.shares.filter((share: any) => share.sharedWithId === s.userId) };

  const workspace = doc.userId === s.userId ? await getTeamWorkspace(s.userId) : null;
  const teamMembers = workspace?.firm.members
    .filter((member: any) => member.userId !== s.userId)
    .map((member: any) => ({
      membershipId: member.id,
      userId: member.userId,
      role: member.role,
      name: member.user.name,
      email: member.user.email,
      avatarUrl: member.user.avatarUrl,
    })) ?? [];
  const canAnnotate =
    (s.role === "LAWYER" || s.role === "ADMIN") &&
    (doc.userId === s.userId || visibleDoc.shares.some((share: any) => share.sharedWithId === s.userId && share.permission === "ANNOTATE"));

  return (
    <DocumentDetailClient
      doc={visibleDoc as any}
      sessionUserId={s.userId}
      sessionRole={s.role}
      teamMembers={teamMembers}
      canShare={doc.userId === s.userId && Boolean(workspace)}
      canAnnotate={canAnnotate}
    />
  );
}
