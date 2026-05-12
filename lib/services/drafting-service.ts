/**
 * Drafting Service — template-based contract generation with version history.
 */

import { prisma } from "@/lib/db";
import { chatComplete, embed } from "@/lib/openai";
import { chunkText } from "@/lib/utils";
import { auditLog } from "./audit-service";
import {
  WORD_MIME,
  buildPakistanLegalDraftText,
  createDraftDocxBuffer,
  draftWordFileName,
} from "./draft-export-service";

type DraftRecord = Awaited<ReturnType<typeof prisma.draftedDocument.findFirst>> extends infer T
  ? NonNullable<T>
  : never;

const TEMPLATE_PROMPTS: Record<string, string> = {
  NDA: `You are a legal drafting assistant. Generate a professional, well-formatted Mutual Non-Disclosure Agreement. Include sections: Parties, Definitions, Obligations, Exclusions, Term, Return of Materials, Governing Law, Entire Agreement, Signature blocks. Use proper legal formatting.`,
  EMPLOYMENT: `You are a legal drafting assistant. Generate a professional Employment Contract with sections: Parties, Position & Duties, Compensation, Benefits, Confidentiality, Non-Compete (where lawful), Termination, Governing Law, Signature.`,
  RENTAL: `You are a legal drafting assistant. Generate a professional Rental/Lease Agreement with sections: Parties, Premises, Term, Rent, Security Deposit, Maintenance, Termination, Governing Law, Signature.`,
  SERVICE: `You are a legal drafting assistant. Generate a professional Service Agreement with sections: Parties, Scope of Services, Fees & Payment, Term, Confidentiality, Intellectual Property, Liability, Termination, Governing Law, Signature.`,
  PARTNERSHIP: `You are a legal drafting assistant. Generate a professional Partnership Agreement with sections: Parties, Purpose, Capital Contributions, Profit/Loss Sharing, Management, Withdrawal/Dissolution, Governing Law, Signature.`,
};

export const CHAT_DRAFT_TYPES = {
  CUSTOM_CONTRACT: {
    label: "Custom Contract",
    prompt:
      "Generate a formal Pakistan-focused custom contract from the conversation. Include parties, recitals/background, definitions where needed, obligations, payment/consideration, term, termination, confidentiality/IP/liability if relevant, dispute resolution, governing law, execution, and schedules if useful.",
  },
  LEGAL_NOTICE: {
    label: "Legal Notice",
    prompt:
      "Generate a formal legal notice suitable for lawyer review in Pakistan. Include sender/recipient details, factual background, cause of action, legal basis, demand/remedy, deadline for compliance, reservation of rights, and signature block.",
  },
  PLAINT: {
    label: "Suit / Plaint Draft",
    prompt:
      "Generate a civil suit plaint draft for Pakistan court filing review. Include court heading placeholder, parties, jurisdiction, facts, cause of action, valuation/court fee placeholders, relief/prayer, interim relief if relevant, verification, list of documents, and signature/advocate placeholders.",
  },
  WRITTEN_STATEMENT: {
    label: "Written Statement",
    prompt:
      "Generate a written statement/defence draft for Pakistan civil litigation review. Include preliminary objections, paragraph-wise reply placeholders, factual defence, legal grounds, prayer, verification, and list of supporting documents.",
  },
  PETITION: {
    label: "Petition / Application",
    prompt:
      "Generate a formal petition/application draft for Pakistan legal review. Include forum heading placeholder, parties, facts, grounds, maintainability/jurisdiction, interim relief if applicable, prayer, affidavit/verification placeholders, and annexure list.",
  },
} as const;

export type ChatDraftType = keyof typeof CHAT_DRAFT_TYPES;

function draftStoragePath(draftId: string) {
  return `draft:${draftId}:docx`;
}

export function draftDocumentStoragePaths(draftId: string) {
  return [draftStoragePath(draftId), `draft:${draftId}`, `uploads/drafts/${draftId}.docx`];
}

async function upsertDraftDocument(draft: DraftRecord) {
  const storagePath = draftStoragePath(draft.id);
  const docxBuffer = await createDraftDocxBuffer({
    title: draft.title,
    content: draft.content,
    templateType: draft.templateType,
    parties: draft.parties,
    version: draft.version,
  });
  const documentData = {
    originalName: draftWordFileName(draft.title),
    storagePath,
    mimeType: WORD_MIME,
    fileSize: docxBuffer.byteLength,
    documentType: draft.templateType,
    status: "COMPLETED",
    extractedText: draft.content,
    summary: `AI-generated ${draft.templateType} draft: ${draft.title}`,
    riskScore: null,
    analysisResult: JSON.stringify({
      source: "drafting-service",
      draftId: draft.id,
      templateType: draft.templateType,
      version: draft.version,
    }),
    processingTime: 0,
  };

  const existing = await prisma.document.findFirst({
    where: { userId: draft.userId, storagePath: { in: draftDocumentStoragePaths(draft.id) } },
    select: { id: true },
  });

  const document = existing
    ? await prisma.document.update({
      where: { id: existing.id },
      data: documentData,
    })
    : await prisma.document.create({
      data: {
        userId: draft.userId,
        ...documentData,
      },
    });

  await syncDraftEmbeddings(document.id, draft.content);
  return document;
}

async function syncDraftEmbeddings(documentId: string, text: string) {
  await prisma.documentEmbedding.deleteMany({ where: { documentId } });
  const chunks = chunkText(text, 500, 50);
  if (!chunks.length) return;

  const vectors = await embed(chunks);
  await prisma.documentEmbedding.createMany({
    data: chunks.map((chunk, i) => ({
      documentId,
      chunkIndex: i,
      chunkText: chunk,
      embedding: JSON.stringify(vectors[i]),
      tokenCount: Math.ceil(chunk.length / 4),
    })),
  });
}

export async function generateDraft(opts: {
  userId: string;
  templateType: keyof typeof TEMPLATE_PROMPTS;
  title: string;
  parties: Record<string, unknown>;
}) {
  const prompt = TEMPLATE_PROMPTS[opts.templateType];
  if (!prompt) throw new Error("Unknown template type");

  const raw = await chatComplete(
    [
      { role: "system", content: prompt + " Return JSON: { \"content\": string }" },
      { role: "user", content: `Inputs:\n${JSON.stringify(opts.parties, null, 2)}` },
    ],
    { temperature: 0.3, max_tokens: 8192, jsonMode: true }
  );
  let parsed: { content: string };
  try { parsed = JSON.parse(raw); } catch { parsed = { content: raw }; }

  const draft = await prisma.draftedDocument.create({
    data: {
      userId: opts.userId,
      templateType: opts.templateType,
      title: opts.title,
      content: parsed.content,
      parties: JSON.stringify(opts.parties),
      version: 1,
      versionHistory: JSON.stringify([]),
    },
  });

  await auditLog({ userId: opts.userId, action: "DRAFT_CREATE", resourceType: "DraftedDocument", resourceId: draft.id });
  return draft;
}

export async function generateDraftFromChat(opts: {
  userId: string;
  sessionId: string;
  documentType: ChatDraftType;
  title: string;
  instructions?: string;
}) {
  const type = CHAT_DRAFT_TYPES[opts.documentType];
  if (!type) throw new Error("Unknown chat draft type");

  const session = await prisma.chatSession.findFirst({
    where: { id: opts.sessionId, userId: opts.userId, status: "ACTIVE" },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 40,
      },
    },
  });
  if (!session) throw new Error("Chat session not found");
  if (session.messages.filter((m) => m.role === "USER").length === 0) {
    throw new Error("Chat first so Lexora has facts to draft from");
  }

  const transcript = session.messages
    .map((m) => `${m.role === "USER" ? "Client/User" : "Lexora"}: ${m.content}`)
    .join("\n\n");

  const raw = await chatComplete(
    [
      {
        role: "system",
        content: `You are Lexora's senior Pakistan legal drafting module.

${type.prompt}

Rules:
- Use ONLY facts supplied in the transcript. If information is missing, insert clear placeholders like [INSERT CNIC] or [INSERT COURT].
- Do not fabricate case numbers, court names, addresses, dates, CNICs, registration numbers, advocates, or statutes not supported by the transcript.
- Use formal legal formatting with numbered headings and clauses.
- Add a short "Missing Information / Lawyer Review Checklist" section near the end.
- Add Pakistan execution, stamping, jurisdiction, verification, or filing placeholders where appropriate.
- Return JSON only: { "content": string, "parties": object, "summary": string }`,
      },
      {
        role: "user",
        content: `Requested document type: ${type.label}
Draft title: ${opts.title}
Extra drafting instructions: ${opts.instructions || "(none)"}

Conversation transcript:
${transcript}`,
      },
    ],
    { temperature: 0.25, max_tokens: 8192, jsonMode: true }
  );

  let parsed: { content: string; parties?: Record<string, unknown>; summary?: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { content: raw };
  }

  const content = buildPakistanLegalDraftText({
    title: opts.title,
    content: parsed.content || raw,
    templateType: opts.documentType,
    parties: parsed.parties || {},
    version: 1,
  });

  const draft = await prisma.draftedDocument.create({
    data: {
      userId: opts.userId,
      templateType: opts.documentType,
      title: opts.title,
      content,
      parties: JSON.stringify({
        ...(parsed.parties || {}),
        source: "chat",
        sessionId: opts.sessionId,
        documentType: opts.documentType,
        instructions: opts.instructions || null,
        summary: parsed.summary || null,
      }),
      version: 1,
      versionHistory: JSON.stringify([]),
    },
  });

  await auditLog({
    userId: opts.userId,
    action: "CHAT_DRAFT_CREATE",
    resourceType: "DraftedDocument",
    resourceId: draft.id,
    metadata: { sessionId: opts.sessionId, documentType: opts.documentType },
  });

  return draft;
}

export async function publishDraftAsDocument(draftId: string, userId: string) {
  const draft = await prisma.draftedDocument.findFirst({ where: { id: draftId, userId } });
  if (!draft) throw new Error("Draft not found");

  const document = await upsertDraftDocument(draft);
  await auditLog({
    userId,
    action: "DRAFT_SAVE_TO_DOCUMENTS",
    resourceType: "Document",
    resourceId: document.id,
    metadata: { draftId },
  });

  return document;
}

export async function saveVersion(draftId: string, userId: string, newContent: string, title?: string) {
  const d = await prisma.draftedDocument.findFirst({ where: { id: draftId, userId } });
  if (!d) throw new Error("Draft not found");
  const legalContent = buildPakistanLegalDraftText({
    title: title?.trim() || d.title,
    content: newContent,
    templateType: d.templateType,
    parties: d.parties,
    version: d.version + 1,
  });
  const history = JSON.parse(d.versionHistory) as { version: number; content: string; savedAt: string }[];
  history.push({ version: d.version, content: d.content, savedAt: d.updatedAt.toISOString() });
  const draft = await prisma.draftedDocument.update({
    where: { id: draftId },
    data: {
      content: legalContent,
      title: title?.trim() || d.title,
      version: d.version + 1,
      versionHistory: JSON.stringify(history),
    },
  });

  const document = await upsertDraftDocument(draft);
  await auditLog({
    userId,
    action: "DRAFT_VERSION_SAVE",
    resourceType: "DraftedDocument",
    resourceId: draft.id,
    metadata: { documentId: document.id, version: draft.version },
  });

  return { draft, document };
}

export async function negotiate(clauseText: string, stance: "buyer" | "seller" | "lawyer" = "lawyer") {
  return chatComplete(
    [
      {
        role: "system",
        content: `You are an experienced negotiator acting as ${stance}. Given a clause, propose counter-language and explain the rationale in 2 short paragraphs.`,
      },
      { role: "user", content: clauseText },
    ],
    { temperature: 0.6 }
  );
}
