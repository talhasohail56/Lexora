"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ScrollText, Loader2, Save, Download, Sparkles, FileText, Mail } from "lucide-react";
import { GlowCard } from "@/components/animated/glow-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageTransition } from "@/components/animated/page-transition";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const TEMPLATES = [
  { type: "NDA", label: "Mutual NDA", desc: "Non-Disclosure Agreement", color: "from-lex-500 to-cyan-500" },
  { type: "EMPLOYMENT", label: "Employment", desc: "Employment contract", color: "from-emerald-500 to-teal-500" },
  { type: "RENTAL", label: "Rental / Lease", desc: "Property lease", color: "from-amber-500 to-orange-500" },
  { type: "SERVICE", label: "Service Agreement", desc: "Services / consultancy", color: "from-amber-500 to-rose-500" },
  { type: "PARTNERSHIP", label: "Partnership", desc: "Joint venture / partnership", color: "from-teal-700 to-amber-500" },
];

export default function DraftPage() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState("NDA");
  const [title, setTitle] = useState("Untitled draft");
  const [parties, setParties] = useState({ partyA: "Acme Inc.", partyB: "XYZ Ltd.", effectiveDate: "2026-06-01", jurisdiction: "Pakistan", confidentialityPeriod: "3 years" });
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [publishedDocumentId, setPublishedDocumentId] = useState<string | null>(null);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("config");
  const [emailing, setEmailing] = useState(false);

  useEffect(() => {
    refresh();
    const draftId = new URLSearchParams(window.location.search).get("draft");
    if (draftId) loadDraft(draftId);
  }, []);

  async function refresh() {
    const r = await fetch("/api/draft");
    const data = await r.json();
    setDrafts(Array.isArray(data) ? data : []);
  }

  async function generate() {
    setLoading(true);
    try {
      const r = await fetch("/api/draft/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateType: selectedType, title, parties }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setContent(data.content);
      setCurrentDraftId(data.id);
      setPublishedDocumentId(null);
      toast.success("Draft generated");
      refresh();
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  async function save() {
    if (!currentDraftId) {
      toast.error("Generate a draft before saving");
      return null;
    }
    const r = await fetch(`/api/draft/${currentDraftId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, title }),
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok) {
      setContent(data.content || content);
      setVersionHistory(JSON.parse(data.versionHistory || "[]"));
      setPublishedDocumentId(data.documentId || null);
      toast.success("Saved as a formatted Word document in Documents");
      refresh();
      return data.documentId as string;
    }
    toast.error(data.error || "Save failed");
    return null;
  }

  async function downloadWord() {
    const documentId = publishedDocumentId || await save();
    if (!documentId) return;
    window.location.href = `/api/documents/${documentId}/download`;
  }

  async function emailWord() {
    if (!currentDraftId) {
      toast.error("Generate a draft before emailing");
      return;
    }
    setEmailing(true);
    try {
      const documentId = await save();
      if (!documentId) return;
      const r = await fetch(`/api/draft/${currentDraftId}/email`, { method: "POST" });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Could not email draft");
      toast.success(`DOCX emailed to ${data.email}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setEmailing(false);
    }
  }

  async function loadDraft(id: string) {
    const r = await fetch(`/api/draft/${id}`);
    const data = await r.json();
    setCurrentDraftId(data.id);
    setTitle(data.title);
    setContent(data.content);
    setSelectedType(data.templateType);
    setPublishedDocumentId(data.documentId || null);
    setVersionHistory(JSON.parse(data.versionHistory || "[]"));
    setActiveTab("editor");
  }

  return (
    <PageTransition>
      <div className="grid max-w-7xl grid-cols-1 gap-4 lg:grid-cols-12">
        <GlowCard className="p-4 lg:col-span-3">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><ScrollText className="h-4 w-4" /> Drafts</h3>
          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto scrollbar-thin">
            {drafts.length === 0 && <p className="text-xs text-muted-foreground">No drafts yet</p>}
            {drafts.map((d) => (
              <button
                key={d.id}
                onClick={() => loadDraft(d.id)}
                className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                  currentDraftId === d.id ? "bg-accent" : "hover:bg-accent/40"
                }`}
              >
                <div className="font-medium truncate">{d.title}</div>
                <div className="text-[10px] text-muted-foreground">{d.templateType} · v{d.version}</div>
              </button>
            ))}
          </div>
        </GlowCard>

        <div className="space-y-4 lg:col-span-9">
          <GlowCard className="p-5">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-2 w-full justify-start overflow-x-auto no-scrollbar sm:w-auto">
                <TabsTrigger value="config">Configure</TabsTrigger>
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="history">History ({versionHistory.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="config" className="space-y-4">
                <div>
                  <Label>Template</Label>
                  <div className="mt-1 grid grid-cols-1 gap-2 min-[430px]:grid-cols-2 md:grid-cols-5">
                    {TEMPLATES.map((t) => (
                      <button
                        key={t.type}
                        onClick={() => setSelectedType(t.type)}
                        className={`p-3 rounded-lg border text-left text-xs transition-all ${
                          selectedType === t.type ? "border-lex-500 bg-lex-500/10" : "border-border bg-card/40 hover:border-lex-500/40"
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-md bg-gradient-to-br ${t.color} mb-2`} />
                        <div className="font-medium text-sm">{t.label}</div>
                        <div className="text-muted-foreground">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Draft title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div><Label>Party A</Label><Input value={parties.partyA} onChange={(e) => setParties({ ...parties, partyA: e.target.value })} /></div>
                  <div><Label>Party B</Label><Input value={parties.partyB} onChange={(e) => setParties({ ...parties, partyB: e.target.value })} /></div>
                  <div><Label>Effective date</Label><Input type="date" value={parties.effectiveDate} onChange={(e) => setParties({ ...parties, effectiveDate: e.target.value })} /></div>
                  <div><Label>Jurisdiction</Label><Input value={parties.jurisdiction} onChange={(e) => setParties({ ...parties, jurisdiction: e.target.value })} /></div>
                </div>

                <Button onClick={generate} disabled={loading} variant="gradient" size="lg">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4" /> Generate draft</>}
                </Button>
              </TabsContent>

              <TabsContent value="editor" className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1" />
                  <Button variant="outline" onClick={save} disabled={!currentDraftId}><Save className="h-4 w-4" /> Save</Button>
                  <Button variant="outline" onClick={downloadWord} disabled={!content}><Download className="h-4 w-4" /> Word</Button>
                  <Button variant="outline" onClick={emailWord} disabled={!content || emailing}>
                    {emailing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    Email DOCX
                  </Button>
                  {publishedDocumentId && (
                    <Button variant="ghost" asChild>
                      <a href={`/documents/${publishedDocumentId}`}><FileText className="h-4 w-4" /> Document</a>
                    </Button>
                  )}
                </div>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={28}
                  className="font-mono text-xs leading-relaxed"
                  placeholder="Generated draft will appear here…"
                />
              </TabsContent>

              <TabsContent value="history" className="space-y-2">
                {versionHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No prior versions yet.</p>
                ) : (
                  versionHistory.map((v, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-3 rounded-lg border bg-card/40"
                    >
                      <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                        <Badge variant="outline">v{v.version}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(v.savedAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{v.content.slice(0, 300)}…</p>
                    </motion.div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </GlowCard>
        </div>
      </div>
    </PageTransition>
  );
}
