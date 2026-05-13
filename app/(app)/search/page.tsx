"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, FileText, Loader2, Sparkles } from "lucide-react";
import { GlowCard } from "@/components/animated/glow-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageTransition } from "@/components/animated/page-transition";
import Link from "next/link";
import { toast } from "sonner";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [scope, setScope] = useState("all");
  const [docs, setDocs] = useState<{ id: string; originalName: string }[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/documents").then((r) => r.json()).then((d) => Array.isArray(d) && setDocs(d));
  }, []);

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, k: "10" });
      if (scope === "legal-corpus") params.set("legalOnly", "true");
      else if (scope !== "all") params.set("documentId", scope);
      const r = await fetch(`/api/search?${params.toString()}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setResults(data.results);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <Sparkles className="h-7 w-7 text-lex-500" /> Semantic search
          </h1>
          <p className="text-muted-foreground">
            Find concepts across uploaded documents and the Pakistan legal corpus using vector similarity.
          </p>
        </div>

        <GlowCard className="p-4">
          <form onSubmit={run} className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder='Try "indemnification cap" or "termination for material breach"'
                className="pl-9 h-12 text-base"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">My documents + Pakistan law</SelectItem>
                  <SelectItem value="legal-corpus">Pakistan legal library only</SelectItem>
                  {docs.map((d) => <SelectItem key={d.id} value={d.id}>{d.originalName}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="submit" variant="gradient" disabled={loading || !q.trim()} className="w-full sm:w-auto">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
              </Button>
            </div>
          </form>
        </GlowCard>

        <div className="space-y-3">
          {results.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              {r.type === "legal" ? (
                <a href={r.sourceUrl} target="_blank" rel="noreferrer">
                  <ResultCard result={r} />
                </a>
              ) : (
                <Link href={`/documents/${r.documentId}`}>
                  <ResultCard result={r} />
                </Link>
              )}
            </motion.div>
          ))}
          {!loading && q && results.length === 0 && (
            <GlowCard className="p-8 text-center text-muted-foreground text-sm">No matches found.</GlowCard>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

function ResultCard({ result: r }: { result: any }) {
  return (
    <GlowCard className="p-4 hover:scale-[1.005] transition-transform">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Badge variant={r.type === "legal" ? "gradient" : "info"} className="gap-1">
          <FileText className="h-3 w-3" /> {r.type === "legal" ? "PK law" : r.documentName}
        </Badge>
        <Badge variant="outline">{r.type === "legal" ? r.sourceType : `chunk ${r.chunkIndex}`}</Badge>
        {r.heading && <Badge variant="secondary">{r.heading}</Badge>}
        <Badge variant="gradient">{(r.similarity * 100).toFixed(0)}% match</Badge>
      </div>
      {r.type === "legal" && <p className="text-xs text-muted-foreground mb-1">{r.documentName}</p>}
      <p className="text-sm leading-relaxed">{r.chunkText}</p>
    </GlowCard>
  );
}
