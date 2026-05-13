"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, FileMinus2, FilePlus2, GitCompare, Loader2, PencilLine, Plus, ShieldCheck, X } from "lucide-react";
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
    if (new Set(ids).size !== ids.length) return toast.error("Choose different documents for comparison");
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
    setPicks((p) => {
      if (p.some((picked, index) => index !== i && picked === v)) {
        toast.error("That document is already selected");
        return p;
      }
      const next = [...p];
      next[i] = v;
      return next;
    });
  }

  function similarityLabel(score: number) {
    const pct = Math.max(0, Math.min(100, (score || 0) * 100));
    if (pct > 0 && pct < 1) return "<1%";
    if (pct >= 99 && pct < 100) return `${pct.toFixed(1)}%`;
    return `${Math.round(pct)}%`;
  }

  return (
    <PageTransition>
      <div className="space-y-6 max-w-6xl">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <GitCompare className="h-7 w-7 text-lex-500" /> Smart Compare
          </h1>
          <p className="text-muted-foreground">Compare contract versions, find what changed, and see why each difference matters before signing.</p>
        </div>

        <GlowCard className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {picks.map((p, i) => (
              <div key={i} className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">Document {String.fromCharCode(65 + i)}</div>
                <Select value={p} onValueChange={(v) => setPick(i, v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {docs.map((d) => (
                      <SelectItem
                        key={d.id}
                        value={d.id}
                        disabled={picks.some((picked, index) => index !== i && picked === d.id)}
                      >
                        {d.originalName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPicks((p) => p.length < 3 ? [...p, ""] : p)}
                disabled={picks.length >= 3}
                className="w-full sm:w-auto"
              >
                <Plus className="h-3.5 w-3.5" /> Add third
              </Button>
              {picks.length > 2 && (
                <Button variant="ghost" size="sm" onClick={() => setPicks((p) => p.slice(0, 2))} className="w-full sm:w-auto">
                  <X className="h-3.5 w-3.5" /> Remove
                </Button>
              )}
            </div>
            <Button variant="gradient" onClick={run} disabled={loading} className="w-full sm:w-auto">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Compare"}
            </Button>
          </div>
        </GlowCard>

        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {Array.isArray(result.added) ? (
              <CompareResultView result={result} similarityLabel={similarityLabel} />
            ) : (
              <>
                <h3 className="font-semibold">3-way comparison results</h3>
                <CompareResultView result={result.ab} title="A vs B" similarityLabel={similarityLabel} />
                <CompareResultView result={result.ac} title="A vs C" similarityLabel={similarityLabel} />
                <CompareResultView result={result.bc} title="B vs C" similarityLabel={similarityLabel} />
              </>
            )}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}

function CompareResultView({
  result,
  title,
  similarityLabel = (score: number) => `${Math.round((score || 0) * 100)}%`,
}: {
  result: any;
  title?: string;
  similarityLabel?: (score: number) => string;
}) {
  const added = Array.isArray(result.added) ? result.added : [];
  const removed = Array.isArray(result.removed) ? result.removed : [];
  const modified = Array.isArray(result.modified) ? result.modified : [];
  const keyDifferences = Array.isArray(result.keyDifferences) ? result.keyDifferences : [];

  return (
    <GlowCard className="p-4 sm:p-5">
      {title && <h3 className="font-semibold mb-3">{title}</h3>}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <Stat label="Added" value={added.length} color="from-emerald-500 to-teal-500" />
        <Stat label="Removed" value={removed.length} color="from-red-500 to-orange-500" />
        <Stat label="Modified" value={modified.length} color="from-amber-500 to-orange-500" />
        <Stat label="Similarity" value={similarityLabel(result.similarityScore)} color="from-lex-500 to-amber-500" />
      </div>

      {result.summary && (
        <div className="mb-4 rounded-lg border border-border bg-card/40 p-3 sm:p-4">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-lex-500" /> Review summary
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
        </div>
      )}

      {keyDifferences.length > 0 && (
        <div className="mb-5 space-y-3">
          <h4 className="text-sm font-semibold">Key differences and legal impact</h4>
          {keyDifferences.map((diff: any, i: number) => (
            <DifferenceCard key={i} diff={diff} />
          ))}
        </div>
      )}

      {added.length || removed.length || modified.length ? (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Clause evidence</h4>
          {added.length > 0 && (
            <Section heading="Added in Document B" color="text-emerald-500">
              {added.map((c: any, i: number) => (
                <Item key={i} kind="add" type={c.clauseType} text={c.text} />
              ))}
            </Section>
          )}
          {removed.length > 0 && (
            <Section heading="Removed from Document A" color="text-red-500">
              {removed.map((c: any, i: number) => (
                <Item key={i} kind="remove" type={c.clauseType} text={c.text} />
              ))}
            </Section>
          )}
          {modified.length > 0 && (
            <Section heading="Modified wording" color="text-amber-500">
              {modified.map((c: any, i: number) => (
                <div key={i} className="p-3 rounded-md border bg-amber-500/5 mb-2">
                  <Badge variant="warning" className="mb-2">{c.clauseType}</Badge>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-xs text-red-500 font-medium">Document A:</span> <span className="line-through opacity-70">{c.before}</span></div>
                    <div><span className="text-xs text-emerald-500 font-medium">Document B:</span> {c.after}</div>
                  </div>
                </div>
              ))}
            </Section>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card/40 p-4 text-sm text-muted-foreground">
          No material clause-level differences were detected.
        </div>
      )}
    </GlowCard>
  );
}

function DifferenceCard({ diff }: { diff: any }) {
  const type = String(diff.changeType || "MODIFIED").toUpperCase();
  const Icon = type === "ADDED" ? FilePlus2 : type === "REMOVED" ? FileMinus2 : PencilLine;
  const tone =
    type === "ADDED"
      ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"
      : type === "REMOVED"
        ? "border-red-500/20 bg-red-500/5 text-red-500"
        : "border-amber-500/20 bg-amber-500/5 text-amber-500";

  return (
    <div className={`rounded-lg border p-3 sm:p-4 ${tone}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Icon className="h-4 w-4" /> {diff.area || "Contract term"}
        </span>
        <Badge variant="outline">{type}</Badge>
        <RiskBadge level={diff.riskLevel} />
      </div>
      {(diff.before || diff.after) && (
        <div className="mb-3 grid gap-3 md:grid-cols-[1fr_auto_1fr]">
          <DiffBox label="Document A" text={diff.before || "Not present"} muted={!diff.before} />
          <div className="hidden items-center justify-center md:flex">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <DiffBox label="Document B" text={diff.after || "Removed"} muted={!diff.after} />
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Impact</div>
          <p className="text-sm leading-relaxed text-foreground/90">{diff.impact}</p>
        </div>
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Recommendation</div>
          <p className="text-sm leading-relaxed text-foreground/90">{diff.recommendation}</p>
        </div>
      </div>
    </div>
  );
}

function DiffBox({ label, text, muted }: { label: string; text: string; muted?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-background/55 p-3">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <p className={`text-sm leading-relaxed ${muted ? "italic text-muted-foreground" : "text-foreground/90"}`}>{text}</p>
    </div>
  );
}

function RiskBadge({ level }: { level?: string }) {
  const risk = String(level || "MEDIUM").toUpperCase();
  const className =
    risk === "CRITICAL" || risk === "HIGH"
      ? "border-red-500/30 bg-red-500/10 text-red-500"
      : risk === "MEDIUM"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-500";

  return (
    <Badge variant="outline" className={className}>
      <AlertTriangle className="mr-1 h-3 w-3" /> {risk} impact
    </Badge>
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
    <div className={`mb-2 rounded-md border p-2.5 ${bg}`}>
      <Badge variant="outline" className="mb-1.5">{type}</Badge>
      <p className="break-words text-sm"><span className={`font-bold ${sCol} mr-1`}>{sym}</span>{text}</p>
    </div>
  );
}
