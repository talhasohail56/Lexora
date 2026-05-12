import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { createFirmWorkspace } from "@/lib/services/team-service";

const Body = z.object({
  name: z.string().trim().min(2).max(120),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = Body.parse(await req.json());
    const firm = await createFirmWorkspace({ userId: session.userId, name: data.name });
    return NextResponse.json({ firm });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Could not create firm" }, { status: 400 });
  }
}
