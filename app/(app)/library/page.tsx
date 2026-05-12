import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, ExternalLink, Search, ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/auth";
import { listLegalSources } from "@/lib/services/legal-corpus-service";
import { safeJson } from "@/lib/utils";
import { PageTransition } from "@/components/animated/page-transition";
import { GlowCard } from "@/components/animated/glow-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function LibraryPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const sources = await listLegalSources("PK");
  const chunkCount = sources.reduce((sum, s) => sum + s._count.chunks, 0);

  return (
    <PageTransition>
      <div className="max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-lex-500" /> Pakistan legal library
            </h1>
            <p className="text-muted-foreground">
              {sources.length} official sources indexed into {chunkCount} RAG chunks.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/search"><Search className="h-4 w-4" /> Search corpus</Link>
            </Button>
            <Button asChild variant="gradient">
              <Link href="/chat"><ShieldCheck className="h-4 w-4" /> Ask Lexora</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <GlowCard className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Jurisdiction</p>
            <p className="mt-1 text-2xl font-bold">Pakistan</p>
          </GlowCard>
          <GlowCard className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Corpus type</p>
            <p className="mt-1 text-2xl font-bold">Federal + SECP</p>
          </GlowCard>
          <GlowCard className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Retrieval mode</p>
            <p className="mt-1 text-2xl font-bold">Vector RAG</p>
          </GlowCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sources.map((source) => {
            const tags = safeJson<string[]>(source.tags, []);
            return (
              <GlowCard key={source.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge variant="gradient" className="mb-2">{source.sourceType}</Badge>
                    <h2 className="font-semibold text-lg leading-tight">{source.title}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{source.authority}</p>
                  </div>
                  <a
                    href={source.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-md border border-border p-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                    aria-label={`Open ${source.title}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{source.summary}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {tags.slice(0, 5).map((tag) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                  <Badge variant="info">{source._count.chunks} chunks</Badge>
                </div>
              </GlowCard>
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
}
