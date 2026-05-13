"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GlowCard } from "@/components/animated/glow-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  FileText, AlertTriangle, Shield, Clock, MessageSquare, Sparkles,
  RefreshCw, BookOpen, Volume2, ArrowLeft, Download, Share2, Trash2, Users
} from "lucide-react";
import { PageTransition } from "@/components/animated/page-transition";
import { Stagger, StaggerItem } from "@/components/animated/scroll-reveal";
import { severityColor, formatBytes, formatRelative } from "@/lib/utils";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { AnimatedCounter } from "@/components/animated/animated-counter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DocumentDetailClient({
  doc,
  sessionUserId,
  sessionRole,
  teamMembers = [],
  canShare = false,
  canAnnotate = false,
}: {
  doc: any;
  sessionUserId: string;
  sessionRole: string;
  teamMembers?: any[];
  canShare?: boolean;
  canAnnotate?: boolean;
}) {
  const [annotationText, setAnnotationText] = useState("");
  const [running, setRunning] = useState(false);
  const [shares, setShares] = useState(doc.shares || []);

  async function reanalyze() {
    setRunning(true);
    try {
      const r = await fetch(`/api/documents/${doc.id}/reanalyze`, { method: "POST" });
      if (!r.ok) throw new Error("Failed");
      toast.success("Re-analysis complete. Refresh to see results.");
      setTimeout(() => location.reload(), 800);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRunning(false);
    }
  }

  async function runCompliance() {
    setRunning(true);
    try {
      const r = await fetch(`/api/compliance/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc.id }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      toast.success(`Compliance: ${data.compliant}/${data.total} rules passed (${data.score}%)`);
    } catch (e: any) {
      toast.error(e.message);
    } finally { setRunning(false); }
  }

  async function extractTimeline() {
    setRunning(true);
    try {
      const r = await fetch(`/api/timeline/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc.id }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      toast.success(`Extracted ${data.events.length} timeline events`);
      setTimeout(() => location.reload(), 500);
    } catch (e: any) { toast.error(e.message); }
    finally { setRunning(false); }
  }

  function speakBrief() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Voice synthesis not supported in this browser");
      return;
    }
    const u = new SpeechSynthesisUtterance(doc.summary || "No summary yet.");
    u.rate = 1.05;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
    toast.success("Reading your brief…");
  }

  async function addAnnotation() {
    if (!annotationText.trim()) return;
    const r = await fetch("/api/annotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: doc.id, content: annotationText }),
    });
    if (r.ok) { toast.success("Annotation added"); setAnnotationText(""); setTimeout(() => location.reload(), 400); }
    else toast.error("Failed");
  }

  const sevCounts = doc.risks.reduce((acc: Record<string, number>, r: any) => ({ ...acc, [r.severity]: (acc[r.severity] || 0) + 1 }), {});

  return (
    <PageTransition>
      <div className="space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Link href="/documents" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="h-3 w-3" /> All documents
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{doc.originalName}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {doc.documentType} · {formatBytes(doc.fileSize)} · uploaded {formatRelative(doc.createdAt)}
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <a href={`/api/documents/${doc.id}/download`}><Download className="h-4 w-4" /> Download</a>
            </Button>
            <Button variant="outline" onClick={speakBrief} className="w-full sm:w-auto"><Volume2 className="h-4 w-4" /> Voice brief</Button>
            <Button variant="outline" onClick={runCompliance} disabled={running} className="w-full sm:w-auto"><Shield className="h-4 w-4" /> Run compliance</Button>
            <Button variant="outline" onClick={extractTimeline} disabled={running} className="w-full sm:w-auto"><Clock className="h-4 w-4" /> Extract timeline</Button>
            <Button variant="outline" onClick={reanalyze} disabled={running} className="w-full sm:w-auto">
              <RefreshCw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} /> Re-analyze
            </Button>
            <Button variant="gradient" asChild className="w-full sm:w-auto">
              <Link href={`/chat?document=${doc.id}`}><MessageSquare className="h-4 w-4" /> Ask AI</Link>
            </Button>
          </div>
        </div>

        {/* Hero stats */}
        <Stagger>
          <div className="grid grid-cols-1 gap-3 min-[430px]:grid-cols-2 md:grid-cols-4">
            {[
              { label: "Risk score", value: Math.round(doc.riskScore || 0), suffix: "/100", icon: AlertTriangle, color: "from-red-500 to-orange-500" },
              { label: "Clauses",    value: doc.clauses.length,             icon: FileText,      color: "from-lex-500 to-cyan-500" },
              { label: "Risks",      value: doc.risks.length,               icon: AlertTriangle, color: "from-amber-500 to-orange-500" },
              { label: "Chunks",     value: doc._count.embeddings,          icon: Sparkles,      color: "from-amber-500 to-rose-500" },
            ].map((s) => (
              <StaggerItem key={s.label}>
                <GlowCard className="p-4">
                  <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${s.color} text-white mb-3`}>
                    <s.icon className="h-4 w-4" />
                  </div>
                  <div className="text-2xl font-bold">
                    <AnimatedCounter value={s.value} suffix={s.suffix} />
                  </div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </GlowCard>
              </StaggerItem>
            ))}
          </div>
        </Stagger>

        {canShare && (
          <DocumentSharePanel
            docId={doc.id}
            shares={shares}
            setShares={setShares}
            teamMembers={teamMembers}
          />
        )}

        {/* Tabs */}
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="flex w-full max-w-full justify-start overflow-x-auto no-scrollbar sm:grid sm:max-w-3xl sm:grid-cols-7">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="clauses">Clauses</TabsTrigger>
            <TabsTrigger value="risks">Risks</TabsTrigger>
            <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="annotations">Notes</TabsTrigger>
            <TabsTrigger value="raw">Raw text</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <GlowCard className="p-4 sm:p-6">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-lex-500" /> Executive summary
                </h3>
                <Button size="sm" variant="ghost" onClick={speakBrief} className="w-full sm:w-auto"><Volume2 className="h-3.5 w-3.5" /> Listen</Button>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {doc.summary || "No summary yet — re-run analysis to generate one."}
              </p>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
                {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((sev) => (
                  <div key={sev} className={`rounded-lg border ${severityColor(sev)} p-3`}>
                    <div className="text-2xl font-bold">{sevCounts[sev] || 0}</div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold">{sev}</div>
                  </div>
                ))}
              </div>
            </GlowCard>
          </TabsContent>

          <TabsContent value="clauses" className="space-y-3">
            {doc.clauses.length === 0 ? (
              <GlowCard className="p-8 text-center text-muted-foreground text-sm">No clauses extracted yet.</GlowCard>
            ) : (
              doc.clauses.map((c: any) => (
                <ClauseCard key={c.id} clause={c} />
              ))
            )}
          </TabsContent>

          <TabsContent value="risks" className="space-y-3">
            {doc.risks.length === 0 ? (
              <GlowCard className="p-8 text-center text-muted-foreground text-sm">No risks detected.</GlowCard>
            ) : (
              doc.risks.map((r: any) => (
                <GlowCard key={r.id} className={`p-4 border ${severityColor(r.severity)}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <Badge variant="outline" className={severityColor(r.severity)}>{r.severity}</Badge>
                    <div className="flex-1">
                      <h4 className="font-medium">{r.category}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                      <p className="text-sm mt-2"><span className="font-medium">💡 Suggestion:</span> {r.suggestion}</p>
                      <p className="text-[11px] text-muted-foreground mt-2">Confidence: {(r.confidence * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </GlowCard>
              ))
            )}
          </TabsContent>

          <TabsContent value="heatmap">
            <ClauseHeatmap doc={doc} />
          </TabsContent>

          <TabsContent value="timeline">
            <TimelineView events={doc.timelineEvents} />
          </TabsContent>

          <TabsContent value="annotations">
            <GlowCard className="p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-lex-500" /> Annotations
              </h3>
              {canAnnotate && (
                <div className="space-y-2 mb-4">
                  <Textarea
                    placeholder="Add a note..."
                    value={annotationText}
                    onChange={(e) => setAnnotationText(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={addAnnotation} variant="gradient" size="sm">Add annotation</Button>
                </div>
              )}
              <div className="space-y-3">
                {doc.annotations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No annotations yet.</p>
                ) : (
                  doc.annotations.map((a: any) => (
                    <div key={a.id} className="p-3 rounded-lg border bg-card/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <span className="font-medium text-foreground">{a.author.name}</span>
                        · {formatRelative(a.createdAt)}
                        {a.isResolved && <Badge variant="success" className="text-[10px]">Resolved</Badge>}
                      </div>
                      <p className="text-sm">{a.content}</p>
                    </div>
                  ))
                )}
              </div>
            </GlowCard>
          </TabsContent>

          <TabsContent value="raw">
            <GlowCard className="p-5 max-h-[600px] overflow-y-auto scrollbar-thin">
              <pre className="text-xs whitespace-pre-wrap leading-relaxed font-mono">
                {doc.extractedText || "No extracted text yet."}
              </pre>
            </GlowCard>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}

function DocumentSharePanel({
  docId,
  shares,
  setShares,
  teamMembers,
}: {
  docId: string;
  shares: any[];
  setShares: (shares: any[]) => void;
  teamMembers: any[];
}) {
  const [target, setTarget] = useState("TEAM");
  const [permission, setPermission] = useState("VIEW_ONLY");
  const [loading, setLoading] = useState(false);

  async function share() {
    setLoading(true);
    try {
      const response = await fetch(`/api/documents/${docId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: target === "TEAM" ? "TEAM" : "MEMBER",
          memberId: target === "TEAM" ? undefined : target,
          permission,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not share document");
      toast.success(target === "TEAM" ? "Shared with firm members" : "Document shared");
      setTimeout(() => location.reload(), 500);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function revoke(shareId: string) {
    try {
      const response = await fetch(`/api/documents/${docId}/share`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not revoke access");
      setShares(shares.filter((share) => share.id !== shareId));
      toast.success("Access revoked");
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  return (
    <GlowCard className="p-5">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-semibold">
            <Share2 className="h-4 w-4 text-lex-500" />
            Team sharing
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            This document is private until you share it with a specific member or the whole firm.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TEAM">All team members</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.userId} value={member.userId}>
                  {member.name} · {member.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={permission} onValueChange={setPermission}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VIEW_ONLY">View only</SelectItem>
              <SelectItem value="ANNOTATE">Can annotate</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={share} disabled={loading || teamMembers.length === 0}>
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
            Share
          </Button>
        </div>
      </div>
      {shares.length ? (
        <div className="grid gap-2 md:grid-cols-2">
          {shares.map((share) => (
            <div key={share.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-background/60 p-3 sm:flex-nowrap">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-lex-500 to-amber-500 text-xs font-semibold text-white">
                {share.sharedWith.avatarUrl ? (
                  <img src={share.sharedWith.avatarUrl} alt={`${share.sharedWith.name} profile`} className="h-full w-full object-cover" />
                ) : (
                  share.sharedWith.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{share.sharedWith.name}</div>
                <div className="truncate text-xs text-muted-foreground">{share.sharedWith.email}</div>
              </div>
              <Badge variant="outline" className="text-[10px]">{share.permission}</Badge>
              <Button variant="ghost" size="icon" onClick={() => revoke(share.id)} aria-label="Revoke access">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">No one else has access yet.</div>
      )}
    </GlowCard>
  );
}

function ClauseCard({ clause }: { clause: any }) {
  const [explanation, setExplanation] = useState<string | null>(clause.explanation);
  const [loading, setLoading] = useState(false);

  async function explain() {
    setLoading(true);
    const r = await fetch(`/api/documents/x/explain-clause`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clauseId: clause.id }),
    });
    const data = await r.json();
    setExplanation(data.explanation);
    setLoading(false);
  }

  return (
    <GlowCard className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <Badge variant="info" className="mb-2">{clause.clauseType}</Badge>
          <p className="text-sm leading-relaxed">{clause.text}</p>
          <div className="mt-2 text-[11px] text-muted-foreground">Confidence: {(clause.confidence * 100).toFixed(0)}%</div>
          {explanation && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 p-3 rounded-md bg-lex-500/5 border border-lex-500/20">
              <div className="text-xs font-semibold text-lex-500 mb-1">In plain English:</div>
              <p className="text-sm">{explanation}</p>
            </motion.div>
          )}
        </div>
        {!explanation && (
          <Button variant="ghost" size="sm" onClick={explain} disabled={loading}>
            {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Explain"}
          </Button>
        )}
      </div>
    </GlowCard>
  );
}

function ClauseHeatmap({ doc }: { doc: any }) {
  const cells = Array.from({ length: 60 }, (_, i) => {
    const risk = doc.risks.find((r: any, idx: number) => idx === i % doc.risks.length);
    const lvl = risk ? { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }[risk.severity as string] || 0 : 0;
    return { lvl };
  });

  const colors = ["bg-emerald-500/10", "bg-emerald-500/30", "bg-amber-500/40", "bg-orange-500/60", "bg-red-500/80"];

  return (
    <GlowCard className="p-6">
      <h3 className="font-semibold mb-3">Risk heatmap by clause position</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Each cell represents a contract segment; intensity reflects detected risk severity.
      </p>
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
        {cells.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.01 }}
            className={`aspect-square rounded ${colors[c.lvl]} border border-border`}
            title={`Segment ${i + 1}`}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground">
        Low
        {colors.map((c, i) => <div key={i} className={`h-3 w-6 rounded ${c}`} />)}
        High
      </div>
    </GlowCard>
  );
}

function TimelineView({ events }: { events: any[] }) {
  if (!events.length) {
    return <GlowCard className="p-8 text-center text-muted-foreground text-sm">No timeline events yet. Click Extract timeline to generate.</GlowCard>;
  }
  return (
    <div className="relative pl-6 border-l border-border space-y-4">
      {events.map((e, i) => (
        <motion.div
          key={e.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="relative"
        >
          <div className={`absolute -left-[27px] top-1.5 h-3 w-3 rounded-full ring-4 ring-background ${
            e.urgency === "PAST_DUE" ? "bg-red-500" : e.urgency === "UPCOMING" ? "bg-amber-500" : "bg-emerald-500"
          }`} />
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="outline">{e.eventType}</Badge>
            <Badge variant={e.urgency === "PAST_DUE" ? "destructive" : e.urgency === "UPCOMING" ? "warning" : "outline"}>
              {e.urgency}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {e.eventDate ? formatRelative(e.eventDate) : e.relativeExpr || "—"}
            </span>
          </div>
          <p className="text-sm">{e.description}</p>
        </motion.div>
      ))}
    </div>
  );
}
