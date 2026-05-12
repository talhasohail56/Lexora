import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { semanticSearch } from "@/lib/services/embedding-service";
import { consumeFeature, subscriptionError } from "@/lib/services/subscription-service";

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = new URL(req.url);
  const q = u.searchParams.get("q") || "";
  const k = parseInt(u.searchParams.get("k") || "5");
  const documentId = u.searchParams.get("documentId") || undefined;
  const legalOnly = u.searchParams.get("legalOnly") === "true";
  const includeLegal = u.searchParams.get("includeLegal") !== "false";
  if (!q.trim()) return NextResponse.json({ results: [] });
  try {
    await consumeFeature(s, "semanticSearches", 1, { legalOnly, includeLegal });
  } catch (e: any) {
    const out = subscriptionError(e, "semanticSearches");
    return NextResponse.json(out.body, { status: out.status });
  }
  const results = await semanticSearch({
    userId: s.userId,
    query: q,
    k,
    scopeDocumentId: legalOnly ? undefined : documentId,
    includeDocuments: !legalOnly,
    includeLegalCorpus: includeLegal,
    countryCode: "PK",
  });
  return NextResponse.json({ results });
}
