import {
  AlignmentType,
  Document as WordDocument,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

export const WORD_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type DraftExportInput = {
  title: string;
  content: string;
  templateType?: string | null;
  parties?: Record<string, unknown> | string | null;
  version?: number | null;
};

function parseParties(parties: DraftExportInput["parties"]) {
  if (!parties) return {};
  if (typeof parties === "string") {
    try {
      return JSON.parse(parties) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return parties;
}

function value(input: unknown, fallback: string) {
  return typeof input === "string" && input.trim() ? input.trim() : fallback;
}

export function cleanDraftTitle(title: string) {
  return (
    title
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, " ")
      .trim() || "Untitled contract"
  );
}

export function draftWordFileName(title: string) {
  return `${cleanDraftTitle(title)}.docx`;
}

export function buildPakistanLegalDraftText(input: DraftExportInput) {
  const parties = parseParties(input.parties);
  const partyA = value(parties.partyA ?? parties.firstParty ?? parties.disclosingParty, "Party A");
  const partyB = value(parties.partyB ?? parties.secondParty ?? parties.receivingParty, "Party B");
  const jurisdiction = value(parties.jurisdiction, "Pakistan");
  const effectiveDate = value(parties.effectiveDate, "____________________");

  let text = input.content.trim();
  const hasExecutionBlock = /(signature\s*:|executed\s+this|in witness whereof|witness\s+[12])/i.test(text);

  if (!/governing law|laws? of pakistan|jurisdiction/i.test(text)) {
    text += `\n\nGOVERNING LAW AND JURISDICTION\nThis Agreement shall be governed by and construed in accordance with the applicable laws of ${jurisdiction}. Subject to any agreed dispute-resolution mechanism, the competent courts and forums in ${jurisdiction} shall have jurisdiction where applicable.`;
  }

  if (!/stamp duty|registration/i.test(text)) {
    text += `\n\nSTAMP DUTY AND REGISTRATION\nThe parties shall ensure that any applicable stamp duty, registration, notarisation, witnessing, or other formal requirement is completed under the relevant federal or provincial laws of Pakistan before relying on this Agreement where such compliance is required.`;
  }

  if (!hasExecutionBlock) {
    text += `\n\nEXECUTION\nIN WITNESS WHEREOF, the parties have executed this Agreement on ${effectiveDate}.\n\nFor and on behalf of ${partyA}\nSignature: ______________________________\nName: ______________________________\nDesignation: ______________________________\nCNIC/Registration No.: ______________________________\nDate: ______________________________\n\nFor and on behalf of ${partyB}\nSignature: ______________________________\nName: ______________________________\nDesignation: ______________________________\nCNIC/Registration No.: ______________________________\nDate: ______________________________\n\nWitness 1\nSignature: ______________________________\nName: ______________________________\nCNIC: ______________________________\n\nWitness 2\nSignature: ______________________________\nName: ______________________________\nCNIC: ______________________________`;
  }

  return text;
}

function stripMarkdown(line: string) {
  return line
    .replace(/^#{1,6}\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .trim();
}

function isHeading(line: string) {
  const clean = stripMarkdown(line);
  if (!clean || clean.length > 95) return false;
  return (
    /^#{1,6}\s+/.test(line) ||
    /^(article|section|clause|schedule)\s+[0-9ivx]+[\s:.-]/i.test(clean) ||
    /^\d+(\.\d+)*[.)]?\s+[A-Z]/.test(clean) ||
    /^[A-Z][A-Z\s,&/-]{5,}$/.test(clean)
  );
}

function paragraphForLine(line: string) {
  const clean = stripMarkdown(line);
  const bullet = /^[-*•]\s+/.test(clean);
  const text = bullet ? clean.replace(/^[-*•]\s+/, "") : clean;

  if (isHeading(line)) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 260, after: 120 },
      children: [new TextRun({ text, bold: true, size: 24 })],
    });
  }

  return new Paragraph({
    spacing: { after: 120 },
    indent: bullet ? { left: 360 } : undefined,
    children: [
      new TextRun({
        text: bullet ? `• ${text}` : text,
        size: 22,
      }),
    ],
  });
}

export async function createDraftDocxBuffer(input: DraftExportInput) {
  const title = cleanDraftTitle(input.title);
  const formalText = buildPakistanLegalDraftText(input);
  const lines = formalText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const doc = new WordDocument({
    creator: "Lexora AI Paralegal Assistant",
    title,
    description: "AI-generated legal contract draft formatted for Pakistan legal review.",
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 34 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 320 },
            children: [
              new TextRun({
                text: `${input.templateType ?? "CONTRACT"} DRAFT${input.version ? ` · VERSION ${input.version}` : ""}`,
                size: 18,
                color: "666666",
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 260 },
            children: [
              new TextRun({
                text: "Prepared as a formal legal draft for review, execution, stamping, and registration where required under applicable Pakistani law.",
                italics: true,
                size: 20,
              }),
            ],
          }),
          ...lines.map(paragraphForLine),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
