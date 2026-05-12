"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Loader2, AlertCircle } from "lucide-react";
import { GlowCard } from "@/components/animated/glow-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageTransition } from "@/components/animated/page-transition";
import { toast } from "sonner";
import { formatRelative, formatDate } from "@/lib/utils";

export default function TimelinePage() {
  const [docs, setDocs] = useState<{ id: string; originalName: string }[]>([]);
  const [documentId, setDocumentId] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadEvents = useCallback(async (id = documentId) => {
    const url = id ? `/api/timeline?documentId=${encodeURIComponent(id)}` : "/api/timeline";
    const r = await fetch(url);
    const data = await r.json();
    setEvents(Array.isArray(data) ? data : []);
  }, [documentId]);

  useEffect(() => {
    fetch("/api/documents").then((r) => r.json()).then((d) => Array.isArray(d) && setDocs(d.filter((x: any) => x.status === "COMPLETED")));
    loadEvents("");
  }, [loadEvents]);

  async function extract() {
    if (!documentId) return;
    setLoading(true);
    try {
      const r = await fetch("/api/timeline/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      toast.success(`Extracted ${data.events.length} events`);
      await loadEvents(documentId);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  function selectDocument(id: string) {
    setDocumentId(id);
    loadEvents(id);
  }

  function showAllEvents() {
    setDocumentId("");
    loadEvents("");
  }

  const pastDue = events.filter((e) => e.urgency === "PAST_DUE").length;
  const upcoming = events.filter((e) => e.urgency === "UPCOMING").length;
  const future = events.filter((e) => e.urgency === "FUTURE").length;

  return (
    <PageTransition>
      <div className="max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Clock className="h-7 w-7 text-lex-500" /> Legal Timeline
          </h1>
          <p className="text-muted-foreground">
            {documentId
              ? `Deadlines, notice periods, payment dates, and milestones for ${docs.find((d) => d.id === documentId)?.originalName || "the selected document"}.`
              : "All deadlines, notice periods, payment dates, and milestones across your contracts."}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Past due",  v: pastDue, color: "from-red-500 to-orange-500" },
            { label: "Upcoming (≤30d)", v: upcoming, color: "from-amber-500 to-orange-500" },
            { label: "Future",    v: future, color: "from-emerald-500 to-teal-500" },
          ].map((t) => (
            <GlowCard key={t.label} className="p-4">
              <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${t.color} mb-2`} />
              <div className="text-3xl font-bold">{t.v}</div>
              <div className="text-xs text-muted-foreground">{t.label}</div>
            </GlowCard>
          ))}
        </div>

        <GlowCard className="p-4">
          <div className="flex items-center gap-2">
            <Select value={documentId} onValueChange={selectDocument}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Select a document to extract from…" /></SelectTrigger>
              <SelectContent>
                {docs.map((d) => <SelectItem key={d.id} value={d.id}>{d.originalName}</SelectItem>)}
              </SelectContent>
            </Select>
            {documentId && (
              <Button variant="outline" onClick={showAllEvents}>
                Show all
              </Button>
            )}
            <Button variant="gradient" onClick={extract} disabled={!documentId || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Extract timeline"}
            </Button>
          </div>
        </GlowCard>

        <GlowCard className="p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Events</h3>
              <p className="text-xs text-muted-foreground">
                {documentId ? "Filtered to the selected document." : "Showing all extracted timeline events."}
              </p>
            </div>
            <Badge variant="outline">{events.length} events</Badge>
          </div>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events extracted yet.</p>
          ) : (
            <div className="relative pl-6 border-l border-border space-y-4">
              {events.map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="relative"
                >
                  <div className={`absolute -left-[27px] top-1.5 h-3 w-3 rounded-full ring-4 ring-background ${
                    e.urgency === "PAST_DUE" ? "bg-red-500" : e.urgency === "UPCOMING" ? "bg-amber-500" : "bg-emerald-500"
                  }`} />
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="outline">{e.eventType}</Badge>
                    <Badge variant={e.urgency === "PAST_DUE" ? "destructive" : e.urgency === "UPCOMING" ? "warning" : "success"}>
                      {e.urgency}
                    </Badge>
                    {!documentId && e.document?.originalName && (
                      <Badge variant="secondary">{e.document.originalName}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {e.eventDate ? formatDate(e.eventDate) : e.relativeExpr || "—"}
                    </span>
                  </div>
                  <p className="text-sm">{e.description}</p>
                </motion.div>
              ))}
            </div>
          )}
        </GlowCard>
      </div>
    </PageTransition>
  );
}
