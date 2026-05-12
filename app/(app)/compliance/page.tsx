"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Loader2, CheckCircle2, XCircle, Minus } from "lucide-react";
import { GlowCard } from "@/components/animated/glow-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { PageTransition } from "@/components/animated/page-transition";
import { toast } from "sonner";
import {
  PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer,
} from "recharts";

export default function CompliancePage() {
  const [docs, setDocs] = useState<{ id: string; originalName: string }[]>([]);
  const [documentId, setDocumentId] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [historic, setHistoric] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/documents").then((r) => r.json()).then((d) => Array.isArray(d) && setDocs(d));
    fetch("/api/compliance/rules").then((r) => r.json()).then(setRules);
  }, []);

  useEffect(() => {
    if (!documentId) { setHistoric([]); return; }
    fetch(`/api/compliance/history?documentId=${documentId}`).then((r) => r.json()).then(setHistoric);
  }, [documentId]);

  async function run() {
    if (!documentId) return;
    setRunning(true);
    setResult(null);
    try {
      const r = await fetch("/api/compliance/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setResult(data);
      toast.success(`${data.compliant}/${data.total} rules compliant`);
    } catch (e: any) { toast.error(e.message); }
    finally { setRunning(false); }
  }

  // Coverage radar by category
  const radarData = Array.from(
    rules.reduce<Map<string, number>>(
      (m, r) => m.set(r.category, (m.get(r.category) || 0) + 1),
      new Map<string, number>()
    ).entries()
  ).map(([category, count]) => ({ category, count }));

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-7 w-7 text-lex-500" /> Compliance
            </h1>
            <p className="text-muted-foreground">Hybrid regex + LLM evaluation against the active rule library.</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <GlowCard className="col-span-12 lg:col-span-8 p-6">
            <h3 className="font-semibold mb-3">Run check</h3>
            <div className="flex gap-2">
              <Select value={documentId} onValueChange={setDocumentId}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Select a document" /></SelectTrigger>
                <SelectContent>
                  {docs.map((d) => <SelectItem key={d.id} value={d.id}>{d.originalName}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="gradient" onClick={run} disabled={!documentId || running}>
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run"}
              </Button>
            </div>

            {(result || historic.length > 0) && (
              <div className="mt-6">
                <ResultSummary result={result || aggregateHistoric(historic)} />
                <RuleResults rows={result?.results || historic} rules={rules} />
              </div>
            )}
          </GlowCard>

          <GlowCard className="col-span-12 lg:col-span-4 p-6">
            <h3 className="font-semibold mb-1">Rule coverage</h3>
            <p className="text-xs text-muted-foreground mb-3">{rules.length} active rules across {radarData.length} categories</p>
            <div className="h-64">
              <ResponsiveContainer>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <PolarRadiusAxis tick={{ fontSize: 10 }} />
                  <Radar dataKey="count" stroke="#1f49f5" fill="#1f49f5" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </GlowCard>
        </div>
      </div>
    </PageTransition>
  );
}

function aggregateHistoric(rows: any[]) {
  if (!rows.length) return null;
  const compliant = rows.filter((r) => r.status === "COMPLIANT").length;
  return { score: Math.round((compliant / rows.length) * 100), compliant, total: rows.length };
}

function ResultSummary({ result }: { result: any }) {
  if (!result) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border bg-gradient-to-br from-lex-500/10 to-amber-500/10 p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">Compliance score</div>
        <div className="text-2xl font-bold text-gradient">{result.score}%</div>
      </div>
      <Progress value={result.score} />
      <p className="text-xs text-muted-foreground mt-2">{result.compliant} of {result.total} rules compliant.</p>
    </motion.div>
  );
}

function RuleResults({ rows, rules }: { rows: any[]; rules: any[] }) {
  if (!rows.length) return null;
  const rulesById = new Map(rules.map((r) => [r.id, r]));
  return (
    <div className="space-y-2">
      {rows.map((row: any, i: number) => {
        const rule = rulesById.get(row.ruleId);
        const Icon = row.status === "COMPLIANT" ? CheckCircle2 : row.status === "PARTIAL" ? Minus : XCircle;
        const color = row.status === "COMPLIANT" ? "text-emerald-500" : row.status === "PARTIAL" ? "text-amber-500" : "text-red-500";
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.02 }}
            className="flex items-start gap-3 p-3 rounded-lg border bg-card/40"
          >
            <Icon className={`h-4 w-4 mt-0.5 ${color}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-medium text-sm">{rule?.name || row.ruleId}</div>
                <Badge variant="outline" className="text-[10px]">{row.status}</Badge>
                {rule?.severity && <Badge variant="outline" className="text-[10px]">{rule.severity}</Badge>}
              </div>
              {rule?.description && <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>}
              {row.explanation && <p className="text-xs mt-1.5 italic">{row.explanation}</p>}
              {row.matchedText && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">Matched: <span className="font-mono">{row.matchedText}</span></p>}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
