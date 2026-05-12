"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Send } from "lucide-react";
import { GlowCard } from "@/components/animated/glow-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/animated/page-transition";
import { toast } from "sonner";

export default function NegotiatorPage() {
  const [clause, setClause] = useState("");
  const [stance, setStance] = useState<"buyer" | "seller" | "lawyer">("lawyer");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  async function negotiate() {
    setLoading(true);
    setResponse("");
    try {
      const r = await fetch("/api/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clause, stance }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setResponse(data.response);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-amber-500" /> Negotiation Simulator
          </h1>
          <p className="text-muted-foreground">AI plays opposing counsel and proposes counter-language with rationale.</p>
        </div>

        <GlowCard className="p-6">
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium mb-2">Choose stance</div>
              <div className="flex gap-2">
                {(["buyer", "seller", "lawyer"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStance(s)}
                    className={`px-3 py-1.5 rounded-md text-sm capitalize transition-colors ${
                      stance === s
                        ? "bg-gradient-to-r from-lex-500 to-amber-500 text-white"
                        : "border border-border bg-card/40 hover:bg-accent"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Paste the clause you'd like to negotiate</div>
              <Textarea
                value={clause}
                onChange={(e) => setClause(e.target.value)}
                rows={6}
                placeholder="E.g. 'The Service Provider shall indemnify the Client against all claims arising from this Agreement…'"
              />
            </div>
            <Button onClick={negotiate} disabled={loading || !clause.trim()} variant="gradient">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Negotiate</>}
            </Button>
          </div>
        </GlowCard>

        {response && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <GlowCard className="p-6">
              <Badge variant="gradient" className="mb-3">Opposing counsel response</Badge>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{response}</p>
            </GlowCard>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
