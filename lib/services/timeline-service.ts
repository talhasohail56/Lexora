/**
 * Legal Timeline Extractor — pulls dates, deadlines and obligations from a contract.
 * Mirrors §4.2.7 of the FYP report.
 */

import { prisma } from "@/lib/db";
import { chatComplete } from "@/lib/openai";
import { createNotification } from "./notification-service";

const PROMPT = `Extract all temporal obligations from the contract. Return JSON: { "events": [ { "eventType": "DEADLINE"|"NOTICE_PERIOD"|"PAYMENT"|"MILESTONE"|"RENEWAL"|"EXPIRY", "description": string, "eventDate": ISO date string or null, "relativeExpr": string or null, "clauseRef": string or null, "urgency": "PAST_DUE"|"UPCOMING"|"FUTURE" } ] }`;

export async function extractTimeline(documentId: string) {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc?.extractedText) throw new Error("Document not ready");

  const raw = await chatComplete(
    [
      { role: "system", content: PROMPT },
      { role: "user", content: doc.extractedText.slice(0, 16000) },
    ],
    { temperature: 0.1, jsonMode: true }
  );

  let parsed: { events: any[] } = { events: [] };
  try { parsed = JSON.parse(raw); } catch { /* keep empty */ }

  // Persist
  const events = await Promise.all(
    (parsed.events || []).map((e) => {
      const eventDate = e.eventDate ? safeDate(e.eventDate) : null;
      const urgency = eventDate
        ? eventDate < new Date()
          ? "PAST_DUE"
          : (eventDate.getTime() - Date.now()) / 86400000 <= 30
          ? "UPCOMING"
          : "FUTURE"
        : e.urgency || "FUTURE";
      return prisma.timelineEvent.create({
        data: {
          documentId,
          eventType: e.eventType,
          description: e.description,
          eventDate,
          relativeExpr: e.relativeExpr,
          clauseRef: e.clauseRef,
          urgency,
        },
      });
    })
  );

  // Fire notifications for PAST_DUE
  for (const ev of events) {
    if (ev.urgency === "PAST_DUE") {
      await createNotification({
        userId: doc.userId,
        type: "TIMELINE_DUE",
        title: "Past-due obligation",
        body: ev.description,
        resourceId: documentId,
        priority: "HIGH",
      });
    }
  }

  return events;
}

function safeDate(s: string): Date | null {
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
