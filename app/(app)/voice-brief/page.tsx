"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mic, Play, Pause, FileText } from "lucide-react";
import { GlowCard } from "@/components/animated/glow-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageTransition } from "@/components/animated/page-transition";

export default function VoiceBriefPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [documentId, setDocumentId] = useState("");
  const [doc, setDoc] = useState<any>(null);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);

  useEffect(() => {
    fetch("/api/documents").then((r) => r.json()).then((d) => Array.isArray(d) && setDocs(d.filter((x: any) => x.status === "COMPLETED")));
  }, []);

  useEffect(() => {
    if (!documentId) return setDoc(null);
    fetch(`/api/documents/${documentId}`).then((r) => r.json()).then(setDoc);
  }, [documentId]);

  function toggle() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (playing) {
      speechSynthesis.cancel();
      setPlaying(false);
      return;
    }
    if (!doc?.summary) return;
    const u = new SpeechSynthesisUtterance(doc.summary);
    u.rate = rate;
    u.onend = () => setPlaying(false);
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
    setPlaying(true);
  }

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Mic className="h-7 w-7 text-lex-500" /> Voice Brief
          </h1>
          <p className="text-muted-foreground">Hands-free document summaries — perfect for your commute.</p>
        </div>

        <GlowCard className="p-5">
          <Select value={documentId} onValueChange={setDocumentId}>
            <SelectTrigger><SelectValue placeholder="Select a document" /></SelectTrigger>
            <SelectContent>
              {docs.map((d) => <SelectItem key={d.id} value={d.id}>{d.originalName}</SelectItem>)}
            </SelectContent>
          </Select>
        </GlowCard>

        {doc && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <GlowCard className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={toggle}
                  className="relative h-32 w-32 rounded-full bg-gradient-to-br from-lex-500 via-amber-500 to-lex-600 text-white flex items-center justify-center shadow-glow"
                >
                  {playing && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-lex-500/40"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                  {playing ? <Pause className="h-12 w-12" /> : <Play className="h-12 w-12 ml-2" />}
                </motion.button>
              </div>
              <Badge variant="info" className="mb-2"><FileText className="h-3 w-3 mr-1" />{doc.originalName}</Badge>
              <div className="mt-2 mb-4">
                <span className="text-xs text-muted-foreground">Playback rate</span>
                <input type="range" min="0.5" max="2" step="0.1" value={rate} onChange={(e) => setRate(parseFloat(e.target.value))} className="w-full max-w-xs mx-auto block accent-lex-500" />
                <span className="text-xs text-muted-foreground">{rate}x</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed text-left max-w-prose mx-auto whitespace-pre-wrap">
                {doc.summary || "No summary available."}
              </p>
            </GlowCard>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
