import { prisma } from "@/lib/db";
import { embed } from "@/lib/openai";
import { cosineSimilarity, safeJson } from "@/lib/utils";

export type RetrievedLegalChunk = {
  type: "legal";
  sourceId: string;
  documentId: string;
  documentName: string;
  sourceTitle: string;
  sourceType: string;
  sourceUrl: string;
  authority: string;
  countryCode: string;
  chunkIndex: number;
  heading: string;
  chunkText: string;
  similarity: number;
};

export async function legalCorpusSearch(opts: {
  query: string;
  k?: number;
  countryCode?: string;
  threshold?: number;
}): Promise<RetrievedLegalChunk[]> {
  const [qVec] = await embed([opts.query]);

  const rows = await prisma.legalCorpusChunk.findMany({
    where: { source: { countryCode: opts.countryCode ?? "PK" } },
    include: {
      source: {
        select: {
          id: true,
          title: true,
          sourceType: true,
          authority: true,
          officialUrl: true,
          countryCode: true,
        },
      },
    },
    take: 2500,
  });

  return rows
    .map((r) => ({
      type: "legal" as const,
      sourceId: r.source.id,
      documentId: r.source.id,
      documentName: r.source.title,
      sourceTitle: r.source.title,
      sourceType: r.source.sourceType,
      sourceUrl: r.source.officialUrl,
      authority: r.source.authority,
      countryCode: r.source.countryCode,
      chunkIndex: r.chunkIndex,
      heading: r.heading,
      chunkText: r.chunkText,
      similarity: cosineSimilarity(qVec, safeJson<number[]>(r.embedding, [])),
    }))
    .filter((s) => (opts.threshold ? s.similarity >= opts.threshold : true))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, opts.k ?? 5);
}

export async function listLegalSources(countryCode = "PK") {
  return prisma.legalSource.findMany({
    where: { countryCode },
    orderBy: [{ sourceType: "asc" }, { title: "asc" }],
    include: { _count: { select: { chunks: true } } },
  });
}
