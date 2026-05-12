import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DocumentDetailClient } from "./client";

export default async function DocPage({ params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) redirect("/login");

  const doc = await prisma.document.findFirst({
    where: { id: params.id, OR: [{ userId: s.userId }, { shares: { some: { sharedWithId: s.userId } } }] },
    include: {
      clauses: { orderBy: { createdAt: "asc" } },
      risks: { orderBy: { severity: "asc" } },
      timelineEvents: { orderBy: { eventDate: "asc" } },
      annotations: { include: { author: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      _count: { select: { embeddings: true } },
    },
  });
  if (!doc) redirect("/documents");

  return <DocumentDetailClient doc={doc as any} sessionUserId={s.userId} sessionRole={s.role} />;
}
