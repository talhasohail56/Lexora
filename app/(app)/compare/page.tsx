"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GitCompare, Loader2, Plus, X, FileText } from "lucide-react";
import { GlowCard } from "@/components/animated/glow-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageTransition } from "@/components/animated/page-transition";
import { toast } from "sonner";

export default function ComparePage() {
  const [docs, setDocs] = useState<{ id: string; originalName: string }[]>([]);
  const [picks, setPicks] = useState<string[]>(["", ""]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/documents").then((r) => r.json()).then((d) => Array.isArray(d) && setDocs(d.filter((x: any) => x.status === "COMPLETED")));
  }, []);

  async function run() {
    const ids = picks.filter(Boolean);
    if (ids.length < 2) return toast.error("Pick at least 2 documents");
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setResult(data);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  function setPick(i: number, v: string) {
    setPicks((p) => { const next = [...p]; next[i] = v; return next; });
  }

  return (
    <PageTransition>
      <div className="space-y-6 max-w-6xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <GitCompare className="h-7 w-7 text-lex-500" /> Smart Compare
          </h1>
          <p className="text-muted-foreground">Clause-level diff between two or three documents with semantic similarity scoring.</p>
        </div>

        <GlowCard className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {picks.map((p, i) => (
              <div key={i} className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">Document {String.fromCharCode(65 + i)}</div>
                <Select value={p} onValueChange={(v) => setPick(i, v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {docs.map((d) => <SelectItem key={d.id} value={d.id}>{d.originalName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPicks((p) => p.length < 3 ? [...p, ""] : p)}
              disabled={picks.length >= 3}
            >
              <Plus className="h-3.5 w-3.5" /> Add third (3-way compare)
            </Button>
            {picks.length > 2 && (
              <Button variant="ghost" size="sm" onClick={() => setPicks((p) => p.slice(0, 2))}>
                <X className="h-3.5 w-3.5" /> Remove
              </Button>
            )}
            <Button variant="gradient" onClick={run} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Compare"}
            </Button>
          </div>
        </GlowCard>

        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {Array.isArray(result.added) ? (
              <CompareResultView result={result} />
            ) : (
              <>
                <h3 className="font-semibold">3-way comparison results</h3>
                <CompareResultView result={result.ab} title="A vs B" />
                <CompareResultView result={result.ac} title="A vs C" />
                <CompareResultView result={result.bc} title="B vs C" />
              </>
            )}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}

function CompareResultView({ result, title }: { result: any; title?: string }) {
  return (
    <GlowCard className="p-5">
      {title && <h3 className="font-semibold mb-3">{title}</h3>}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <Stat label="Added" value={result.added.length} color="from-emerald-500 to-teal-500" />
        <Stat label="Removed" value={result.removed.length} color="from-red-500 to-orange-500" />
        <Stat label="Modified" value={result.modified.length} color="from-amber-500 to-orange-500" />
        <Stat label="Similarity" value={`${Math.round((result.similarityScore || 0) * 100)}%`} color="from-lex-500 to-amber-500" />
      </div>

      <Section heading="Added" color="text-emerald-500">
        {result.added.map((c: any, i: number) => (
          <Item key={i} kind="add" type={c.clauseType} text={c.text} />
        ))}
      </Section>
      <Section heading="Removed" color="text-red-500">
        {result.removed.map((c: any, i: number) => (
          <Item key={i} kind="remove" type={c.clauseType} text={c.text} />
        ))}
      </Section>
      <Section heading="Modified" color="text-amber-500">
        {result.modified.map((c: any, i: number) => (
          <div key={i} className="p-3 rounded-md border bg-amber-500/5 mb-2">
            <Badge variant="warning" className="mb-2">{c.clauseType}</Badge>
            <div className="space-y-2 text-sm">
              <div><span className="text-xs text-red-500 font-medium">- before:</span> <span className="line-through opacity-70">{c.before}</span></div>
              <div><span className="text-xs text-emerald-500 font-medium">+ after:</span> {c.after}</div>
            </div>
          </div>
        ))}
      </Section>
    </GlowCard>
  );
}

function Stat({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <div className={`rounded-lg p-4 bg-gradient-to-br ${color} text-white`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-90">{label}</div>
    </div>
  );
}

function Section({ heading, children, color }: { heading: string; children: React.ReactNode; color: string }) {
  return (
    <div className="mt-3">
      <h4 className={`text-sm font-semibold mb-1.5 ${color}`}>{heading}</h4>
      {children}
    </div>
  );
}

function Item({ kind, type, text }: { kind: "add" | "remove"; type: string; text: string }) {
  const bg = kind === "add" ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20";
  const sym = kind === "add" ? "+" : "-";
  const sCol = kind === "add" ? "text-emerald-500" : "text-red-500";
  return (
    <div className={`p-2.5 rounded-md border ${bg} mb-2`}>
      <Badge variant="outline" className="mb-1.5">{type}</Badge>
      <p className="text-sm"><span className={`font-bold ${sCol} mr-1`}>{sym}</span>{text}</p>
    </div>
  );
}
