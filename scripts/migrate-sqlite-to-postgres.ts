import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const sqlitePath = process.env.SQLITE_SOURCE ?? "prisma/dev.db";
const batchSize = Number(process.env.MIGRATE_BATCH_SIZE ?? 500);

type ModelKey =
  | "user"
  | "document"
  | "clause"
  | "risk"
  | "documentEmbedding"
  | "legalSource"
  | "legalCorpusChunk"
  | "complianceRule"
  | "complianceCheck"
  | "chatSession"
  | "chatMessage"
  | "draftedDocument"
  | "annotation"
  | "documentShare"
  | "timelineEvent"
  | "notification"
  | "auditLog"
  | "legalTemplate";

const tables: Array<{
  table: string;
  model: ModelKey;
  dateFields: string[];
  booleanFields?: string[];
}> = [
  { table: "User", model: "user", dateFields: ["otpExpiry", "createdAt", "updatedAt"], booleanFields: ["isVerified"] },
  { table: "Document", model: "document", dateFields: ["createdAt", "updatedAt"] },
  { table: "Clause", model: "clause", dateFields: ["createdAt"] },
  { table: "Risk", model: "risk", dateFields: ["createdAt"] },
  { table: "DocumentEmbedding", model: "documentEmbedding", dateFields: ["createdAt"] },
  { table: "LegalSource", model: "legalSource", dateFields: ["effectiveDate", "lastReviewedAt", "createdAt", "updatedAt"] },
  { table: "LegalCorpusChunk", model: "legalCorpusChunk", dateFields: ["createdAt"] },
  { table: "ComplianceRule", model: "complianceRule", dateFields: ["createdAt", "updatedAt"], booleanFields: ["requiresLLM", "isActive"] },
  { table: "ComplianceCheck", model: "complianceCheck", dateFields: ["checkedAt"] },
  { table: "ChatSession", model: "chatSession", dateFields: ["createdAt", "updatedAt"] },
  { table: "ChatMessage", model: "chatMessage", dateFields: ["createdAt"] },
  { table: "DraftedDocument", model: "draftedDocument", dateFields: ["createdAt", "updatedAt"] },
  { table: "Annotation", model: "annotation", dateFields: ["createdAt", "updatedAt"], booleanFields: ["isResolved"] },
  { table: "DocumentShare", model: "documentShare", dateFields: ["createdAt"] },
  { table: "TimelineEvent", model: "timelineEvent", dateFields: ["eventDate", "createdAt"] },
  { table: "Notification", model: "notification", dateFields: ["createdAt"], booleanFields: ["isRead"] },
  { table: "AuditLog", model: "auditLog", dateFields: ["createdAt"] },
  { table: "LegalTemplate", model: "legalTemplate", dateFields: ["createdAt", "updatedAt"], booleanFields: ["isActive"] },
];

const deleteOrder: ModelKey[] = [
  "auditLog",
  "notification",
  "timelineEvent",
  "documentShare",
  "annotation",
  "draftedDocument",
  "chatMessage",
  "chatSession",
  "complianceCheck",
  "complianceRule",
  "legalTemplate",
  "legalCorpusChunk",
  "legalSource",
  "documentEmbedding",
  "risk",
  "clause",
  "document",
  "user",
];

function sqliteJson<T>(sql: string): T[] {
  const output = execFileSync("sqlite3", ["-json", sqlitePath, sql], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 200,
  }).trim();

  return output ? JSON.parse(output) : [];
}

function countRows(table: string) {
  const [{ count }] = sqliteJson<{ count: number }>(`select count(*) as count from "${table}";`);
  return Number(count);
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function normalizeRow(row: Record<string, unknown>, dateFields: string[], booleanFields: string[] = []) {
  const next: Record<string, unknown> = { ...row };

  for (const field of dateFields) {
    const value = next[field];
    if (value === null || value === undefined || value === "") continue;
    if (typeof value === "number") {
      next[field] = new Date(value);
      continue;
    }
    if (typeof value === "string") {
      const numeric = Number(value);
      next[field] = Number.isFinite(numeric) ? new Date(numeric) : new Date(value);
    }
  }

  for (const field of booleanFields) {
    const value = next[field];
    if (value === null || value === undefined || typeof value === "boolean") continue;
    next[field] = value === 1 || value === "1" || value === "true";
  }

  return next;
}

async function clearPostgres() {
  for (const model of deleteOrder) {
    await (prisma[model] as any).deleteMany();
  }
}

async function copyTable(table: string, model: ModelKey, dateFields: string[], booleanFields: string[] = []) {
  const total = countRows(table);
  let copied = 0;

  for (let offset = 0; offset < total; offset += batchSize) {
    const rows = sqliteJson<Record<string, unknown>>(
      `select * from ${quoteIdentifier(table)} order by rowid limit ${batchSize} offset ${offset};`
    ).map((row) => normalizeRow(row, dateFields, booleanFields));

    if (rows.length) {
      await (prisma[model] as any).createMany({
        data: rows,
        skipDuplicates: true,
      });
      copied += rows.length;
    }
  }

  console.log(`${table}: ${copied}/${total}`);
}

async function verifyCounts() {
  const mismatches: string[] = [];

  for (const { table, model } of tables) {
    const sqliteCount = countRows(table);
    const postgresCount = await (prisma[model] as any).count();
    if (sqliteCount !== postgresCount) {
      mismatches.push(`${table}: sqlite=${sqliteCount}, postgres=${postgresCount}`);
    }
  }

  if (mismatches.length) {
    throw new Error(`Migration count mismatch:\n${mismatches.join("\n")}`);
  }
}

async function main() {
  if (!existsSync(sqlitePath)) {
    throw new Error(`SQLite source not found: ${sqlitePath}`);
  }

  console.log(`Migrating ${sqlitePath} -> PostgreSQL`);
  await clearPostgres();

  for (const { table, model, dateFields, booleanFields } of tables) {
    await copyTable(table, model, dateFields, booleanFields);
  }

  await verifyCounts();
  console.log("Migration complete. All table counts match.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
