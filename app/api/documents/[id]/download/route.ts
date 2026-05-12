import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join, basename } from "node:path";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { WORD_MIME, createDraftDocxBuffer } from "@/lib/services/draft-export-service";

export const runtime = "nodejs";

function safeAttachmentName(name: string, fallback: string) {
  const clean = basename(name || fallback)
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return clean || fallback;
}

function fileResponse(buffer: Buffer, mimeType: string, fileName: string) {
  const safeName = safeAttachmentName(fileName, "document.docx");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(buffer.byteLength),
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doc = await prisma.document.findFirst({
    where: {
      id: params.id,
      OR: [{ userId: s.userId }, { shares: { some: { sharedWithId: s.userId } } }],
    },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (doc.storagePath.startsWith("uploads/")) {
    try {
      const file = await readFile(join(process.cwd(), "public", doc.storagePath));
      return fileResponse(file, doc.mimeType, doc.originalName);
    } catch {
      // Generated draft files are created on demand below, which also keeps Vercel deployments portable.
    }
  }

  const buffer = await createDraftDocxBuffer({
    title: doc.originalName.replace(/\.docx$/i, ""),
    content: doc.extractedText || doc.summary || "",
    templateType: doc.documentType,
    version: null,
  });

  return fileResponse(buffer, WORD_MIME, doc.originalName.endsWith(".docx") ? doc.originalName : `${doc.originalName}.docx`);
}
