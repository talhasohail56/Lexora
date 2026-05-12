/**
 * Embedding & RAG service — chunked embedding storage + cosine similarity retrieval.
 * Mirrors §4.2.4 of the FYP report.
 */

import { prisma } from "@/lib/db";
import { embed } from "@/lib/openai";
import { cosineSimilarity, safeJson } from "@/lib/utils";
import { legalCorpusSearch, type RetrievedLegalChunk } from "./legal-corpus-service";

export type RetrievedDocumentChunk = {
  type: "document";
  documentId: string;
  documentName: string;
  chunkIndex: number;
  chunkText: string;
  similarity: number;
};

export type RetrievedChunk = RetrievedDocumentChunk | RetrievedLegalChunk;

export async function semanticSearch(opts: {
  userId: string;
  query: string;
  k?: number;
  scopeDocumentId?: string;
  threshold?: number;
  includeDocuments?: boolean;
  includeLegalCorpus?: boolean;
  countryCode?: string;
}): Promise<RetrievedChunk[]> {
  const includeDocuments = opts.includeDocuments !== false;
  const includeLegalCorpus = opts.includeLegalCorpus !== false;
  const [qVec] = includeDocuments ? await embed([opts.query]) : [[]];

  // Pull embeddings + parent doc names (scoped to user-owned or shared).
  const where: any = {
    document: {
      OR: [
        { userId: opts.userId },
        { shares: { some: { sharedWithId: opts.userId } } },
      ],
    },
  };
  if (opts.scopeDocumentId) where.documentId = opts.scopeDocumentId;

  const [rows, legalRows] = await Promise.all([
    includeDocuments
      ? prisma.documentEmbedding.findMany({
          where,
          include: { document: { select: { id: true, originalName: true } } },
          take: 2000, // safety bound
        })
      : Promise.resolve([]),
    includeLegalCorpus
      ? legalCorpusSearch({
          query: opts.query,
          k: Math.max(opts.k ?? 5, 12),
          countryCode: opts.countryCode ?? "PK",
          threshold: opts.threshold,
        })
      : Promise.resolve([]),
  ]);

  const documentRows: RetrievedDocumentChunk[] = rows
    .map((r) => ({
      type: "document" as const,
      documentId: r.document.id,
      documentName: r.document.originalName,
      chunkIndex: r.chunkIndex,
      chunkText: r.chunkText,
      similarity: cosineSimilarity(qVec, safeJson<number[]>(r.embedding, [])),
    }))
    .filter((s) => (opts.threshold ? s.similarity >= opts.threshold : true));

  const scored = [...documentRows, ...legalRows]
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, opts.k ?? 5);

  return scored;
}
