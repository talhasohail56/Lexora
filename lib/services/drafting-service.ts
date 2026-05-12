/**
 * Drafting Service — template-based contract generation with version history.
 */

import { prisma } from "@/lib/db";
import { chatComplete } from "@/lib/openai";
import { auditLog } from "./audit-service";

const TEMPLATE_PROMPTS: Record<string, string> = {
  NDA: `You are a legal drafting assistant. Generate a professional, well-formatted Mutual Non-Disclosure Agreement. Include sections: Parties, Definitions, Obligations, Exclusions, Term, Return of Materials, Governing Law, Entire Agreement, Signature blocks. Use proper legal formatting.`,
  EMPLOYMENT: `You are a legal drafting assistant. Generate a professional Employment Contract with sections: Parties, Position & Duties, Compensation, Benefits, Confidentiality, Non-Compete (where lawful), Termination, Governing Law, Signature.`,
  RENTAL: `You are a legal drafting assistant. Generate a professional Rental/Lease Agreement with sections: Parties, Premises, Term, Rent, Security Deposit, Maintenance, Termination, Governing Law, Signature.`,
  SERVICE: `You are a legal drafting assistant. Generate a professional Service Agreement with sections: Parties, Scope of Services, Fees & Payment, Term, Confidentiality, Intellectual Property, Liability, Termination, Governing Law, Signature.`,
  PARTNERSHIP: `You are a legal drafting assistant. Generate a professional Partnership Agreement with sections: Parties, Purpose, Capital Contributions, Profit/Loss Sharing, Management, Withdrawal/Dissolution, Governing Law, Signature.`,
};

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

export async function saveVersion(draftId: string, userId: string, newContent: string) {
  const d = await prisma.draftedDocument.findFirst({ where: { id: draftId, userId } });
  if (!d) throw new Error("Draft not found");
  const history = JSON.parse(d.versionHistory) as { version: number; content: string; savedAt: string }[];
  history.push({ version: d.version, content: d.content, savedAt: d.updatedAt.toISOString() });
  return prisma.draftedDocument.update({
    where: { id: draftId },
    data: { content: newContent, version: d.version + 1, versionHistory: JSON.stringify(history) },
  });
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
