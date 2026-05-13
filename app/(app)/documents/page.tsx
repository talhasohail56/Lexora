import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { GlowCard } from "@/components/animated/glow-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Plus, AlertTriangle, Eye, Trash2 } from "lucide-react";
import { PageTransition } from "@/components/animated/page-transition";
import { formatRelative, formatBytes, severityColor } from "@/lib/utils";

export default async function DocumentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const docs = await prisma.document.findMany({
    where: { OR: [{ userId: session.userId }, { shares: { some: { sharedWithId: session.userId } } }] },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      shares: { where: { sharedWithId: session.userId }, select: { permission: true } },
      _count: { select: { clauses: true, risks: true, embeddings: true } },
    },
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My documents</h1>
            <p className="text-muted-foreground">All your uploaded contracts and analyses.</p>
          </div>
          <Button variant="gradient" asChild className="w-full sm:w-auto">
            <Link href="/documents/upload"><Plus className="h-4 w-4" /> Upload</Link>
          </Button>
        </div>

        {docs.length === 0 ? (
          <GlowCard className="p-8 text-center sm:p-16">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-lex-500/20 to-amber-500/20 flex items-center justify-center mb-4">
              <FileText className="h-7 w-7 text-lex-500" />
            </div>
            <h2 className="font-semibold text-lg">No documents yet</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-md mx-auto">
              Upload your first contract to get started with AI analysis, risk scoring, and semantic search.
            </p>
            <Button variant="gradient" asChild className="w-full sm:w-auto">
              <Link href="/documents/upload"><Plus className="h-4 w-4" /> Upload a document</Link>
            </Button>
          </GlowCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {docs.map((d) => (
              <Link key={d.id} href={`/documents/${d.id}`}>
                <GlowCard className="h-full p-4 transition-all hover:scale-[1.01] sm:p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-lex-500/20 to-amber-500/20 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-lex-500" />
                    </div>
                    <StatusBadge status={d.status} />
                  </div>
                  <div className="break-words text-sm font-medium" title={d.originalName}>
                    {d.originalName}
                  </div>
                  {d.userId !== session.userId && (
                    <div className="mt-1 text-[11px] text-lex-600">
                      Shared by {d.user.name} · {d.shares[0]?.permission === "ANNOTATE" ? "Can annotate" : "View only"}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {d.documentType || "GENERAL"} · {formatBytes(d.fileSize)} · {formatRelative(d.createdAt)}
                  </div>

                  {d.status === "COMPLETED" && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <AlertTriangle className="h-3 w-3" /> Risk score
                        </span>
                        <span className="font-medium">{Math.round(d.riskScore || 0)}/100</span>
                      </div>
                      <Progress value={d.riskScore || 0} />
                      <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                        <span>{d._count.clauses} clauses</span>
                        <span>·</span>
                        <span>{d._count.risks} risks</span>
                        <span>·</span>
                        <span>{d._count.embeddings} chunks</span>
                      </div>
                    </div>
                  )}
                </GlowCard>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}

function StatusBadge({ status }: { status: string }) {
  const v: Record<string, any> = {
    UPLOADED:   { variant: "outline",  label: "Uploaded" },
    EXTRACTING: { variant: "info",     label: "Extracting…" },
    ANALYSING:  { variant: "warning",  label: "Analysing…" },
    COMPLETED:  { variant: "success",  label: "Ready" },
    FAILED:     { variant: "destructive", label: "Failed" },
  };
  const o = v[status] || v.UPLOADED;
  return <Badge variant={o.variant} className="text-[10px]">{o.label}</Badge>;
}
