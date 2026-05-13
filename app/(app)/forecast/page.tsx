"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Loader2, ScalingIcon, Scale } from "lucide-react";
import { GlowCard } from "@/components/animated/glow-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageTransition } from "@/components/animated/page-transition";
import { Progress } from "@/components/ui/progress";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function ForecastPage() {
  const [docs, setDocs] = useState<{ id: string; originalName: string }[]>([]);
  const [documentId, setDocumentId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/documents").then((r) => r.json()).then((d) => Array.isArray(d) && setDocs(d.filter((x: any) => x.status === "COMPLETED")));
  }, []);

  async function forecast() {
    if (!documentId) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/forecast?documentId=${documentId}`);
      const data = await r.json();
      setResult(data);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }

  return (
    <PageTransition>
      <div className="max-w-5xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <Activity className="h-7 w-7 text-lex-500" /> Court Forecast
          </h1>
          <p className="text-muted-foreground">
            Bayesian-style outcome forecasting based on clause patterns, severity, and historical priors.
            <Badge variant="warning" className="mt-2 sm:ml-2 sm:mt-0">Experimental</Badge>
          </p>
        </div>

        <GlowCard className="p-5">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={documentId} onValueChange={setDocumentId}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Select a document" /></SelectTrigger>
              <SelectContent>
                {docs.map((d) => <SelectItem key={d.id} value={d.id}>{d.originalName}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={forecast} disabled={!documentId || loading} variant="gradient" className="w-full sm:w-auto">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Forecast"}
            </Button>
          </div>
        </GlowCard>

        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Outcome label="Favourable" pct={result.favourable} color="from-emerald-500 to-teal-500" />
              <Outcome label="Mixed"      pct={result.mixed}      color="from-amber-500 to-orange-500" />
              <Outcome label="Unfavourable" pct={result.unfavourable} color="from-red-500 to-rose-500" />
            </div>

            <GlowCard className="p-5">
              <h3 className="font-semibold mb-3">Risk factor breakdown</h3>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={result.factors}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="weight" fill="url(#fcGrad)" radius={[6, 6, 0, 0]} />
                    <defs>
                      <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1f49f5" />
                        <stop offset="100%" stopColor="#d946ef" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlowCard>

            <GlowCard className="p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Scale className="h-4 w-4 text-lex-500" /> Forecast rationale</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.rationale}</p>
            </GlowCard>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}

function Outcome({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <GlowCard className="p-5">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-3xl font-bold mb-2 text-gradient">{pct}%</div>
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </GlowCard>
  );
}
