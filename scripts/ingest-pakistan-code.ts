import { PrismaClient } from "@prisma/client";
import pdfParse from "pdf-parse";
import { embed } from "../lib/openai";
import { chunkText } from "../lib/utils";

const prisma = new PrismaClient();

const BASE = "https://pakistancode.gov.pk/english";
const TARGET_SOURCES = Number(process.env.PK_CODE_TARGET_SOURCES || 1000);
const MAX_TEXT_CHARS = Number(process.env.PK_CODE_MAX_TEXT_CHARS || 20000);
const MAX_CHUNKS_PER_SOURCE = Number(process.env.PK_CODE_MAX_CHUNKS_PER_SOURCE || 5);
const DISCOVERY_CONCURRENCY = Number(process.env.PK_CODE_DISCOVERY_CONCURRENCY || 4);
const PDF_CONCURRENCY = Number(process.env.PK_CODE_PDF_CONCURRENCY || 8);
const EMBED_BATCH_SIZE = Number(process.env.PK_CODE_EMBED_BATCH_SIZE || 100);

type DiscoveredLaw = {
  title: string;
  pageUrl: string;
};

type IngestedLaw = DiscoveredLaw & {
  pdfUrl?: string;
  text: string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function decodeHtml(value: string) {
  return value
    .replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(value: string) {
  return decodeHtml(value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
}

async function fetchText(url: string, tries = 3): Promise<string> {
  let lastError: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "user-agent": "Lexora-FYP-RAG-Indexer/1.0 (+local academic project)",
        },
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.text();
    } catch (error) {
      lastError = error;
      await sleep(500 * (i + 1));
    }
  }
  throw lastError;
}

async function fetchBuffer(url: string, tries = 3): Promise<Buffer> {
  let lastError: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "user-agent": "Lexora-FYP-RAG-Indexer/1.0 (+local academic project)",
        },
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (error) {
      lastError = error;
      await sleep(500 * (i + 1));
    }
  }
  throw lastError;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

async function discoverPakistanCodeLaws(): Promise<DiscoveredLaw[]> {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const pages = await mapLimit(letters, DISCOVERY_CONCURRENCY, async (letter) => {
    const html = await fetchText(`${BASE}/LGu0xAD?alp=${letter}&page=1&action=inactive`);
    const laws: DiscoveredLaw[] = [];
    const re = /<a\s+href="(UY2FqaJw1[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(html))) {
      laws.push({
        pageUrl: `${BASE}/${decodeHtml(match[1])}`,
        title: stripHtml(match[2]),
      });
    }
    return laws;
  });

  const byUrl = new Map<string, DiscoveredLaw>();
  for (const law of pages.flat()) {
    if (law.title && !byUrl.has(law.pageUrl)) byUrl.set(law.pageUrl, law);
  }
  return [...byUrl.values()].slice(0, TARGET_SOURCES);
}

async function ingestOne(law: DiscoveredLaw, index: number): Promise<IngestedLaw> {
  try {
    const html = await fetchText(law.pageUrl);
    const title = stripHtml(html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || law.title);
    const pdfUrl = html.match(/https:\/\/pakistancode\.gov\.pk\/pdffiles\/[^"'\s<>]+\.pdf/i)?.[0];
    let text = "";

    if (pdfUrl) {
      try {
        const pdf = await fetchBuffer(pdfUrl);
        const parsed = await pdfParse(pdf);
        text = parsed.text;
      } catch (error) {
        console.warn(`PDF text failed for ${title}: ${(error as Error).message}`);
      }
    }

    if (!text.trim()) {
      text = stripHtml(html);
    }

    text = text.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_CHARS);
    return { ...law, title, pdfUrl, text };
  } catch (error) {
    console.warn(`Source failed ${index + 1}: ${law.title}: ${(error as Error).message}`);
    return {
      ...law,
      text: `${law.title}. Pakistan Code source page: ${law.pageUrl}`,
    };
  }
}

function sourceTypeForTitle(title: string) {
  if (/ordinance/i.test(title)) return "REGULATION";
  if (/order|rules|regulations|scheme/i.test(title)) return "GUIDELINE";
  return "ACT";
}

async function main() {
  console.log(`Discovering ${TARGET_SOURCES} real Pakistan Code sources...`);
  const laws = await discoverPakistanCodeLaws();
  console.log(`Discovered ${laws.length} unique Pakistan Code law pages.`);

  const existing = await prisma.legalSource.findMany({
    where: { countryCode: "PK" },
    select: { id: true },
  });
  if (existing.length) {
    await prisma.legalCorpusChunk.deleteMany({ where: { sourceId: { in: existing.map((s) => s.id) } } });
    await prisma.legalSource.deleteMany({ where: { countryCode: "PK" } });
  }

  const ingested = await mapLimit(laws, PDF_CONCURRENCY, async (law, index) => {
    const result = await ingestOne(law, index);
    if ((index + 1) % 50 === 0 || index + 1 === laws.length) {
      console.log(`Fetched ${index + 1}/${laws.length} sources.`);
    }
    return result;
  });

  const sources = ingested.map((law, index) => ({
    id: `pk-code-${String(index + 1).padStart(4, "0")}`,
    countryCode: "PK",
    jurisdiction: "Pakistan",
    title: law.title,
    sourceType: sourceTypeForTitle(law.title),
    authority: "Pakistan Code, Ministry of Law and Justice",
    citation: law.title,
    officialUrl: law.pageUrl,
    effectiveDate: undefined,
    lastReviewedAt: new Date(),
    summary: `Official Pakistan Code source. ${law.pdfUrl ? `PDF: ${law.pdfUrl}` : "PDF link not found; page text indexed."}`,
    tags: JSON.stringify(["Pakistan Code", "federal law", sourceTypeForTitle(law.title).toLowerCase()]),
  }));

  await prisma.legalSource.createMany({ data: sources });

  const pendingChunks = ingested.flatMap((law, sourceIndex) => {
    const chunks = chunkText(law.text, 700, 80).slice(0, MAX_CHUNKS_PER_SOURCE);
    const normalizedChunks = chunks.length ? chunks : [law.text || law.title];
    return normalizedChunks.map((chunk, chunkIndex) => ({
      sourceId: sources[sourceIndex].id,
      title: law.title,
      chunkIndex,
      heading: chunkIndex === 0 ? "Opening provisions" : `Extract ${chunkIndex + 1}`,
      chunkText: chunk,
      tokenCount: Math.ceil(chunk.length / 4),
    }));
  });

  console.log(`Created ${sources.length} real source records; embedding ${pendingChunks.length} chunks...`);
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

  console.log(`Done. ${sources.length} actual Pakistan Code sources, ${totalChunks} chunks.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
