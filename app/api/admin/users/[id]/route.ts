import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { auditLog } from "@/lib/services/audit-service";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { role, status } = await req.json();
  const before = await prisma.user.findUnique({ where: { id: params.id } });
  const updated = await prisma.user.update({ where: { id: params.id }, data: { ...(role && { role }), ...(status && { status }) } });
  if (role) await auditLog({ userId: s.userId, action: "ROLE_CHANGE", resourceType: "User", resourceId: params.id, metadata: { from: before?.role, to: role } });
  if (status) await auditLog({ userId: s.userId, action: "STATUS_CHANGE", resourceType: "User", resourceId: params.id, metadata: { from: before?.status, to: status } });
  return NextResponse.json(updated);
}
