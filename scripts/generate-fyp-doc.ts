import { readFile, writeFile } from "node:fs/promises";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

const SOURCE = "docs/Lexora_FYP_Presentation_Guide.md";
const OUT = "docs/Lexora_FYP_Presentation_Guide.docx";

const ACCENT = "B86A2C";
const TEAL = "143A35";
const MUTED = "5B5B5B";
const BORDER = "D7D2C8";
const HEADER_FILL = "F4EFE6";

function textRun(text: string, opts: Record<string, unknown> = {}) {
  return new TextRun({
    text,
    font: "Aptos",
    size: 21,
    color: "222222",
    ...opts,
  });
}

function cleanInline(value: string) {
  return value.replace(/`([^`]+)`/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1").trim();
}

function paragraph(text: string, options: Record<string, unknown> = {}) {
  return new Paragraph({
    spacing: { after: 150, line: 300 },
    children: [textRun(cleanInline(text))],
    ...options,
  });
}

function heading(text: string, level: number) {
  const headingLevel =
    level === 1 ? HeadingLevel.TITLE :
    level === 2 ? HeadingLevel.HEADING_1 :
    level === 3 ? HeadingLevel.HEADING_2 :
    HeadingLevel.HEADING_3;

  const size = level === 1 ? 38 : level === 2 ? 29 : level === 3 ? 24 : 21;
  const color = level <= 2 ? TEAL : ACCENT;

  return new Paragraph({
    heading: headingLevel,
    spacing: { before: level === 1 ? 120 : 280, after: 120 },
    keepNext: true,
    children: [textRun(cleanInline(text), { bold: true, size, color })],
  });
}

function bullet(text: string) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80, line: 280 },
    children: [textRun(cleanInline(text))],
  });
}

function callout(text: string) {
  return new Paragraph({
    spacing: { before: 100, after: 150, line: 300 },
    border: {
      left: { color: ACCENT, size: 16, style: BorderStyle.SINGLE },
    },
    indent: { left: 220 },
    children: [textRun(cleanInline(text), { italics: true, color: MUTED })],
  });
}

function parseTable(lines: string[]) {
  const rows = lines
    .filter((line, index) => index !== 1)
    .map((line) =>
      line
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cleanInline(cell))
    );

  const columnCount = Math.max(...rows.map((row) => row.length));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((row, rowIndex) =>
      new TableRow({
        tableHeader: rowIndex === 0,
        children: Array.from({ length: columnCount }).map((_, cellIndex) =>
          new TableCell({
            width: { size: Math.floor(100 / columnCount), type: WidthType.PERCENTAGE },
            margins: { top: 110, bottom: 110, left: 120, right: 120 },
            shading: rowIndex === 0 ? { fill: HEADER_FILL } : undefined,
            children: [
              new Paragraph({
                spacing: { after: 0, line: 260 },
                children: [
                  textRun(row[cellIndex] || "", {
                    bold: rowIndex === 0,
                    size: rowIndex === 0 ? 19 : 18,
                    color: rowIndex === 0 ? TEAL : "222222",
                  }),
                ],
              }),
            ],
          })
        ),
      })
    ),
  });
}

function isTableStart(lines: string[], index: number) {
  return lines[index]?.trim().startsWith("|") && lines[index + 1]?.trim().match(/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/);
}

async function main() {
  const markdown = await readFile(SOURCE, "utf8");
  const lines = markdown.split(/\r?\n/);
  const children: (Paragraph | Table)[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 220, after: 80 },
      children: [textRun("LEXORA", { bold: true, size: 26, color: ACCENT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [textRun("AI Paralegal Assistant", { bold: true, size: 42, color: TEAL })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 260 },
      children: [textRun("FYP Presentation and Technical Documentation", { size: 24, color: MUTED })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 420 },
      children: [textRun(`Prepared for final-year project presentation - ${new Date().toISOString().slice(0, 10)}`, { size: 19, color: MUTED })],
    })
  );

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line) continue;
    if (line === "---") continue;
    if (line.startsWith("# ")) continue;
    if (line.startsWith("## ")) {
      children.push(heading(line.replace(/^##\s+/, ""), 2));
      continue;
    }
    if (line.startsWith("### ")) {
      children.push(heading(line.replace(/^###\s+/, ""), 3));
      continue;
    }
    if (line.startsWith("#### ")) {
      children.push(heading(line.replace(/^####\s+/, ""), 4));
      continue;
    }
    if (isTableStart(lines, i)) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i += 1;
      }
      i -= 1;
      children.push(parseTable(tableLines));
      children.push(paragraph(""));
      continue;
    }
    if (/^-\s+/.test(line)) {
      children.push(bullet(line.replace(/^-\s+/, "")));
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      children.push(paragraph(line, {
        indent: { left: 320, hanging: 220 },
        spacing: { after: 80, line: 280 },
      }));
      continue;
    }
    if (line.startsWith('"') || line.startsWith("Lexora turns") || line.startsWith("An end-to-end")) {
      children.push(callout(line.replace(/^"|"$/g, "")));
      continue;
    }
    if (/^[A-Za-z].+:\s*$/.test(line)) {
      children.push(paragraph(line, {
        spacing: { before: 80, after: 80 },
        children: [textRun(cleanInline(line), { bold: true, color: TEAL })],
      }));
      continue;
    }

    children.push(paragraph(line));
  }

  const doc = new Document({
    creator: "Lexora",
    title: "Lexora FYP Presentation Guide",
    description: "Detailed FYP presentation and technical documentation for Lexora AI Paralegal Assistant.",
    styles: {
      default: {
        document: { run: { font: "Aptos", size: 21 } },
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { bold: true, size: 29, color: TEAL, font: "Aptos" },
          paragraph: { spacing: { before: 280, after: 120 }, keepNext: true },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { bold: true, size: 24, color: ACCENT, font: "Aptos" },
          paragraph: { spacing: { before: 220, after: 100 }, keepNext: true },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 },
          },
        },
        headers: {},
        children,
      },
    ],
  });

  await writeFile(OUT, await Packer.toBuffer(doc));
  console.log(`Generated ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
