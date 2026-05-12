"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, Plus, Sparkles, FileText, Loader2 } from "lucide-react";
import { GlowCard } from "@/components/animated/glow-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PageTransition } from "@/components/animated/page-transition";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatRelative, safeJson } from "@/lib/utils";

export function ChatClient({
  sessions,
  documents,
  initialSessionId,
  initialMessages,
  scopeDocumentId: initialScope,
}: {
  sessions: { id: string; title: string; updatedAt: string }[];
  documents: { id: string; originalName: string }[];
  initialSessionId?: string;
  initialMessages: any[];
  scopeDocumentId?: string;
}) {
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
  const [scope, setScope] = useState<string>(initialScope || "all");
  const [messages, setMessages] = useState<any[]>(initialMessages || []);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || sending) return;
    const userMsg = { id: `tmp-${Date.now()}`, role: "USER", content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          content: userMsg.content,
          scopeDocumentId: scope === "all" || scope === "legal-corpus" ? undefined : scope,
          legalOnly: scope === "legal-corpus",
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setSessionId(data.sessionId);
      setMessages((m) => [...m, data.message]);
      // refresh URL to keep state
      window.history.replaceState({}, "", `/chat?session=${data.sessionId}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  }

  function newChat() {
    setSessionId(undefined);
    setMessages([]);
    window.history.replaceState({}, "", "/chat");
  }

  async function loadSession(id: string) {
    setSessionId(id);
    const r = await fetch(`/api/chat/sessions/${id}`);
    const data = await r.json();
    setMessages(data.messages || []);
    window.history.replaceState({}, "", `/chat?session=${id}`);
  }

  return (
    <PageTransition>
      <div className="grid h-[calc(100vh-8rem)] min-h-0 grid-cols-12 gap-4 overflow-hidden">
        {/* Sessions */}
        <GlowCard className="col-span-12 flex min-h-0 flex-col overflow-hidden p-3 md:col-span-3">
          <Button variant="gradient" onClick={newChat} className="mb-3 shrink-0"><Plus className="h-4 w-4" /> New chat</Button>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-1">
            Sessions
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1 scrollbar-thin">
            {sessions.length === 0 && <p className="text-xs text-muted-foreground px-2 py-4">No sessions yet</p>}
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => loadSession(s.id)}
                className={`w-full text-left px-2 py-2 rounded-md text-sm transition-colors ${
                  sessionId === s.id ? "bg-accent text-foreground" : "hover:bg-accent/40 text-muted-foreground"
                }`}
              >
                <div className="truncate">{s.title}</div>
                <div className="text-[10px] text-muted-foreground">{formatRelative(s.updatedAt)}</div>
              </button>
            ))}
          </div>
        </GlowCard>

        {/* Chat pane */}
        <GlowCard className="col-span-12 flex min-h-0 flex-col overflow-hidden p-0 md:col-span-9">
          <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
            <Sparkles className="h-4 w-4 text-lex-500" />
            <span className="font-semibold text-sm">RAG Chat</span>
            <div className="ml-auto flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Scope:</span>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger className="w-56 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">My documents + Pakistan law</SelectItem>
                  <SelectItem value="legal-corpus">Pakistan law only</SelectItem>
                  {documents.map((d) => <SelectItem key={d.id} value={d.id}>{d.originalName} + Pakistan law</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-4 pr-3 scrollbar-thin">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-lex-500 to-amber-500 flex items-center justify-center text-white mb-4 shadow-glow">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg">Ask anything about your documents</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Answers are grounded in your uploaded contracts and the indexed Pakistan legal corpus.
                </p>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md w-full">
                  {[
                    "What's the termination notice period?",
                    "Summarize the indemnification scope.",
                    "What does Pakistani contract law require for valid consent?",
                    "Do e-signatures work under Pakistan law?",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="text-left text-xs p-3 rounded-lg border border-border bg-card/40 hover:bg-accent/60 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${m.role === "USER" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "ASSISTANT" && (
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-lex-500 to-amber-500 flex items-center justify-center text-white shadow-soft">
                      <Sparkles className="h-4 w-4" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    m.role === "USER"
                      ? "bg-gradient-to-br from-lex-500 to-amber-500 text-white"
                      : "bg-card border border-border"
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    {m.role === "ASSISTANT" && m.sourceChunks && (
                      <div className="mt-3 pt-3 border-t border-border/40 flex flex-wrap gap-1">
                        {safeJson<any[]>(m.sourceChunks, []).slice(0, 4).map((s, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] gap-1">
                            <FileText className="h-2.5 w-2.5" /> {s.type === "legal" ? "PK law" : s.documentName} · {(s.similarity * 100).toFixed(0)}%
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {sending && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-lex-500 to-amber-500 flex items-center justify-center text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="bg-card border border-border rounded-2xl px-4 py-3 flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={send} className="shrink-0 border-t border-border p-3">
            <div className="relative">
              <Textarea
                placeholder="Ask anything…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={2}
                className="resize-none pr-12"
              />
              <Button type="submit" disabled={sending || !input.trim()} variant="gradient" size="icon" className="absolute right-2 bottom-2">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </form>
        </GlowCard>
      </div>
    </PageTransition>
  );
}
