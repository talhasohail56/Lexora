import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ChatClient } from "./client";

export default async function ChatPage({ searchParams }: { searchParams: { session?: string; document?: string } }) {
  const s = await getSession();
  if (!s) redirect("/login");

  const sessions = await prisma.chatSession.findMany({
    where: { userId: s.userId, status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
  });

  const docs = await prisma.document.findMany({
    where: { userId: s.userId, status: "COMPLETED" },
    select: { id: true, originalName: true },
    orderBy: { createdAt: "desc" },
  });

  let activeMessages: any[] = [];
  if (searchParams.session) {
    activeMessages = await prisma.chatMessage.findMany({
      where: { sessionId: searchParams.session },
      orderBy: { createdAt: "asc" },
    });
  }

  return (
    <ChatClient
      sessions={sessions.map((x) => ({ id: x.id, title: x.title, updatedAt: x.updatedAt.toISOString() }))}
      documents={docs}
      initialSessionId={searchParams.session}
      initialMessages={activeMessages}
      scopeDocumentId={searchParams.document}
    />
  );
}
