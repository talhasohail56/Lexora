/**
 * Document Service — upload, text extraction, chunking, embedding orchestration.
 * Mirrors §4.2.2 of the FYP report.
 */

import { prisma } from "@/lib/db";
import { chunkText } from "@/lib/utils";
import { embed } from "@/lib/openai";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { auditLog } from "./audit-service";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const ACCEPTED_MIMES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

// Magic-byte signatures from the report (§5.4).
function checkMagicBytes(buf: Buffer, mime: string): boolean {
  const head = buf.slice(0, 4);
  if (mime === "application/pdf") return head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46;
  if (mime.includes("officedocument")) return head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04;
  if (mime === "text/plain") return true;
  return false;
}

export async function uploadDocument(opts: {
  userId: string;
  file: File;
  documentType?: string;
}) {
  if (opts.file.size > 20 * 1024 * 1024) throw new Error("File exceeds 20 MB limit");
  if (!ACCEPTED_MIMES.has(opts.file.type)) throw new Error("Unsupported file type");

  const buf = Buffer.from(await opts.file.arrayBuffer());
  if (!checkMagicBytes(buf, opts.file.type)) throw new Error("File header does not match its extension");

  await mkdir(UPLOAD_DIR, { recursive: true });
  const safeName = `${Date.now()}-${opts.file.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
  const storagePath = join("uploads", safeName);
  await writeFile(join(UPLOAD_DIR, safeName), buf);

  const doc = await prisma.document.create({
    data: {
      userId: opts.userId,
      originalName: opts.file.name,
      storagePath,
      mimeType: opts.file.type,
      fileSize: opts.file.size,
      documentType: opts.documentType ?? "GENERAL",
      status: "UPLOADED",
    },
  });

  await auditLog({ userId: opts.userId, action: "UPLOAD", resourceType: "Document", resourceId: doc.id, metadata: { fileSize: opts.file.size } });

  // Kick off async pipeline (fire-and-forget).
  void processDocument(doc.id, buf, opts.file.type).catch(async () => {
    await prisma.document.update({ where: { id: doc.id }, data: { status: "FAILED" } });
  });

  return doc;
}

export async function processDocument(documentId: string, buffer: Buffer, mime: string) {
  await prisma.document.update({ where: { id: documentId }, data: { status: "EXTRACTING" } });
  const text = await extractText(buffer, mime);
  await prisma.document.update({ where: { id: documentId }, data: { extractedText: text } });

  // Chunk + embed
  const chunks = chunkText(text, 500, 50);
  const vectors = await embed(chunks);
  await prisma.documentEmbedding.createMany({
    data: chunks.map((chunkText, i) => ({
      documentId,
      chunkIndex: i,
      chunkText,
      embedding: JSON.stringify(vectors[i]),
      tokenCount: Math.ceil(chunkText.length / 4),
    })),
  });

  // Trigger AI analysis (defined in ai-analyzer-service)
  const { analyseDocument } = await import("./ai-analyzer-service");
  await analyseDocument(documentId);
}

async function extractText(buf: Buffer, mime: string): Promise<string> {
  if (mime === "application/pdf") {
    try {
      // Lazy import — pdf-parse pulls heavy deps.
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buf);
      return data.text || "";
    } catch {
      return buf.toString("utf-8");
    }
  }
  if (mime.includes("officedocument")) {
    try {
      const mammoth = await import("mammoth");
      const r = await mammoth.extractRawText({ buffer: buf });
      return r.value || "";
    } catch {
      return buf.toString("utf-8");
    }
  }
  return buf.toString("utf-8");
}

export async function deleteDocument(documentId: string, userId: string) {
  await prisma.document.delete({ where: { id: documentId } });
  await auditLog({ userId, action: "DELETE", resourceType: "Document", resourceId: documentId });
}
