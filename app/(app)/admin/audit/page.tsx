"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Play, Pause, RotateCcw } from "lucide-react";
import { GlowCard } from "@/components/animated/glow-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/animated/page-transition";
import { formatRelative } from "@/lib/utils";

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [playing, setPlaying] = useState(false);
  const [cursor, setCursor] = useState(0);

  useEffect(() => { fetch("/api/admin/audit").then((r) => r.json()).then((d) => { setLogs(d); setCursor(d.length); }); }, []);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setCursor((c) => {
        if (c >= logs.length) { setPlaying(false); return c; }
        return c + 1;
      });
    }, 250);
    return () => clearInterval(t);
  }, [playing, logs.length]);

  const visible = logs.slice(0, cursor);
  const actionCounts: Record<string, number> = visible.reduce((m: Record<string, number>, l) => ({ ...m, [l.action]: (m[l.action] || 0) + 1 }), {});

  return (
    <PageTransition>
      <div className="space-y-6 max-w-6xl">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <Activity className="h-7 w-7 text-lex-500" /> Audit replay
          </h1>
          <p className="text-muted-foreground">{logs.length} audit entries · scrub through history</p>
        </div>

        <GlowCard className="p-5">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setPlaying((p) => !p)}>
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCursor(0)}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 sm:mx-3">
              <input
                type="range"
                min={0}
                max={logs.length}
                value={cursor}
                onChange={(e) => setCursor(parseInt(e.target.value))}
                className="w-full accent-lex-500"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>{cursor} / {logs.length} entries</span>
                <span>{logs[cursor - 1] ? formatRelative(logs[cursor - 1].createdAt) : "—"}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(actionCounts).map(([a, c]) => (
              <Badge key={a} variant="outline">{a} <span className="ml-1 font-bold">{c as number}</span></Badge>
            ))}
          </div>
        </GlowCard>

        <GlowCard className="p-5">
          <h3 className="font-semibold mb-3">Audit log</h3>
          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto scrollbar-thin">
            {visible.map((l, i) => (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i, 30) * 0.02 }}
                className="flex flex-col gap-1 rounded-md border bg-card/40 p-2 text-xs sm:flex-row sm:items-center sm:gap-3"
              >
                <Badge variant="outline" className="font-mono text-[10px]">{l.action}</Badge>
                <span className="font-medium truncate flex-1">{l.resourceType || "—"} {l.resourceId ? `· ${l.resourceId.slice(0, 6)}` : ""}</span>
                <span className="text-muted-foreground">{l.ipAddress || "—"}</span>
                <span className="text-muted-foreground">{formatRelative(l.createdAt)}</span>
              </motion.div>
            ))}
          </div>
        </GlowCard>
      </div>
    </PageTransition>
  );
}
