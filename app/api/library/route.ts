import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listLegalSources } from "@/lib/services/legal-corpus-service";
import { requireFeature, subscriptionError } from "@/lib/services/subscription-service";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await requireFeature(session, "legalCorpusAccess");
  } catch (e: any) {
    const out = subscriptionError(e, "legalCorpusAccess");
    return NextResponse.json(out.body, { status: out.status });
  }
  const sources = await listLegalSources("PK");
  return NextResponse.json({ sources });
}
