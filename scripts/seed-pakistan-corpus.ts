import { PrismaClient } from "@prisma/client";
import { embed } from "../lib/openai";
import { PAKISTAN_CORPUS_REVIEWED_AT, PAKISTAN_LEGAL_CORPUS } from "../lib/legal/pakistan-corpus";

const prisma = new PrismaClient();
const EMBED_BATCH_SIZE = Number(process.env.PK_CORPUS_EMBED_BATCH_SIZE || 100);

async function main() {
  console.log("Indexing Pakistan legal corpus...");
  const corpus = PAKISTAN_LEGAL_CORPUS;

  const existing = await prisma.legalSource.findMany({
    where: { countryCode: "PK" },
    select: { id: true },
  });
  if (existing.length) {
    await prisma.legalCorpusChunk.deleteMany({
      where: { sourceId: { in: existing.map((source) => source.id) } },
    });
    await prisma.legalSource.deleteMany({ where: { countryCode: "PK" } });
  }

  const sources = corpus.map((source, index) => ({
    id: `pk-source-${String(index + 1).padStart(4, "0")}`,
    countryCode: "PK",
    jurisdiction: "Pakistan",
    title: source.title,
    sourceType: source.sourceType,
    authority: source.authority,
    citation: source.citation,
    officialUrl: source.officialUrl,
    effectiveDate: source.effectiveDate ? new Date(source.effectiveDate) : undefined,
    lastReviewedAt: new Date(PAKISTAN_CORPUS_REVIEWED_AT),
    summary: source.summary,
    tags: JSON.stringify(source.tags),
  }));

  await prisma.legalSource.createMany({ data: sources });
  console.log(`Created ${sources.length} corpus documents.`);

  const pendingChunks = corpus.flatMap((source, sourceIndex) =>
    source.chunks.map((chunk, chunkIndex) => ({
      sourceId: sources[sourceIndex].id,
      title: source.title,
      chunkIndex,
      heading: chunk.heading,
      chunkText: chunk.text,
      tokenCount: Math.ceil(chunk.text.length / 4),
    }))
  );

  let totalChunks = 0;
  for (let i = 0; i < pendingChunks.length; i += EMBED_BATCH_SIZE) {
    const batch = pendingChunks.slice(i, i + EMBED_BATCH_SIZE);
    const vectors = await embed(batch.map((chunk) => `${chunk.title}\n${chunk.heading}\n${chunk.chunkText}`));

    await prisma.legalCorpusChunk.createMany({
      data: batch.map((chunk, index) => ({
        sourceId: chunk.sourceId,
        chunkIndex: chunk.chunkIndex,
        heading: chunk.heading,
        chunkText: chunk.chunkText,
        embedding: JSON.stringify(vectors[index]),
        tokenCount: chunk.tokenCount,
      })),
    });

    totalChunks += batch.length;
    console.log(`Embedded ${totalChunks}/${pendingChunks.length} chunks.`);
  }

  console.log(`Done. ${corpus.length} documents, ${totalChunks} chunks.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
