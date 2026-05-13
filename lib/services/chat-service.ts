/**
 * Chat Service — RAG-grounded multi-turn chat against user's document corpus.
 */

import { prisma } from "@/lib/db";
import { chatComplete } from "@/lib/openai";
import { semanticSearch } from "./embedding-service";

const SYSTEM_PROMPT = `You are Lexora, an AI paralegal assistant for Pakistan-focused legal document review. Answer using ONLY the retrieved context below, drawn from the user's uploaded documents and the Pakistan legal corpus. If the answer cannot be supported by the context, say so. Cite source names for every legal point. Do not present this as a final legal opinion; recommend lawyer review for high-stakes decisions. Keep responses concise and structured.`;

export async function ensureSession(userId: string, sessionId?: string, title?: string) {
  if (sessionId) {
    const s = await prisma.chatSession.findFirst({ where: { id: sessionId, userId } });
    if (s) return s;
  }
  return prisma.chatSession.create({ data: { userId, title: title || "New Chat" } });
}

export async function sendMessage(opts: {
  userId: string;
  sessionId?: string;
  content: string;
  scopeDocumentId?: string;
  legalOnly?: boolean;
}) {
  const session = await ensureSession(opts.userId, opts.sessionId);

  // Persist user message
  await prisma.chatMessage.create({
    data: { sessionId: session.id, role: "USER", content: opts.content },
  });

  // RAG retrieval plus user profile for personalization.
  const [chunks, profile] = await Promise.all([
    semanticSearch({
      userId: opts.userId,
      query: opts.content,
      k: 12,
      scopeDocumentId: opts.scopeDocumentId,
      includeDocuments: !opts.legalOnly,
      includeLegalCorpus: true,
      countryCode: "PK",
    }),
    prisma.user.findUnique({
      where: { id: opts.userId },
      select: {
        role: true,
        organization: true,
        jurisdiction: true,
        persona: true,
        practiceArea: true,
        primaryUseCase: true,
        preferredTone: true,
        profileSummary: true,
      },
    }),
  ]);

  const context = chunks
    .map(
      (c, i) =>
        `[${i + 1}] (${c.type === "legal" ? "Pakistan legal corpus" : "User document"}: ${c.documentName}, chunk ${c.chunkIndex}, sim ${c.similarity.toFixed(2)}):\n${c.chunkText}`
    )
    .join("\n\n---\n\n");

  // Last 10 turns for context
  const history = await prisma.chatMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  history.reverse();

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "system",
      content: `USER WORKSPACE PROFILE:\n${profile?.profileSummary || "No setup profile saved yet."}\nRole: ${profile?.role || "USER"}\nOrganization: ${profile?.organization || "not set"}\nPrimary use case: ${profile?.primaryUseCase || "not set"}\nPreferred tone: ${profile?.preferredTone || "Detailed with citations"}\nIf the user is a lawyer, frame AI as preparation and evidence support while preserving counsel's judgment. If the user is not a lawyer, use plain language and suggest professional review for high-stakes actions.`,
    },
    { role: "system", content: `RETRIEVED CONTEXT:\n${context || "(no documents indexed yet)"}` },
    ...history.map((h) => ({ role: h.role.toLowerCase() as "user" | "assistant", content: h.content })),
  ];

  const response = await chatComplete(messages, { temperature: 0.3, max_tokens: 1400 });

  const assistantMsg = await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: "ASSISTANT",
      content: response,
      sourceChunks: JSON.stringify(
        chunks.map((c) => ({
          documentId: c.documentId,
          documentName: c.documentName,
          type: c.type,
          chunkIndex: c.chunkIndex,
          similarity: c.similarity,
          sourceUrl: c.type === "legal" ? c.sourceUrl : undefined,
          sourceType: c.type === "legal" ? c.sourceType : undefined,
        }))
      ),
    },
  });

  // Auto-update session title using first user message
  if (history.length <= 1) {
    await prisma.chatSession.update({
      where: { id: session.id },
      data: { title: opts.content.slice(0, 60) },
    });
  }

  return { sessionId: session.id, message: assistantMsg, sources: chunks };
}

export async function listSessions(userId: string) {
  return prisma.chatSession.findMany({
    where: { userId, status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });
}

export async function listMessages(sessionId: string, userId: string) {
  const s = await prisma.chatSession.findFirst({ where: { id: sessionId, userId } });
  if (!s) throw new Error("Session not found");
  return prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });
}
