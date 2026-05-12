import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadDocument } from "@/lib/services/document-service";
import { consumeFeature, subscriptionError } from "@/lib/services/subscription-service";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const s = await getSession();
    if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const documentType = (formData.get("documentType") as string) || "GENERAL";
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    await consumeFeature(s, "documentUpload", 1, { fileName: file.name, documentType });
    const doc = await uploadDocument({ userId: s.userId, file, documentType });
    return NextResponse.json({ id: doc.id, status: doc.status, riskScore: doc.riskScore });
  } catch (e: any) {
    if (String(e.message).includes("SUBSCRIPTION") || String(e.message).includes("PLAN_") || String(e.message).includes("ROLE_")) {
      const out = subscriptionError(e, "documentUpload");
      return NextResponse.json(out.body, { status: out.status });
    }
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
