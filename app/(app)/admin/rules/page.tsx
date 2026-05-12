"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Gavel, Plus, Loader2 } from "lucide-react";
import { GlowCard } from "@/components/animated/glow-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageTransition } from "@/components/animated/page-transition";
import { toast } from "sonner";

export default function AdminRulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", category: "Contract Essentials",
    jurisdiction: "GENERIC", rulePattern: "", severity: "MEDIUM" as const, requiresLLM: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => { refresh(); }, []);
  async function refresh() { setRules(await fetch("/api/compliance/rules").then((r) => r.json())); }

  async function create() {
    setLoading(true);
    const r = await fetch("/api/compliance/rules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (r.ok) { toast.success("Rule added"); setOpen(false); refresh(); }
    else toast.error("Failed");
    setLoading(false);
  }

  return (
    <PageTransition>
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Gavel className="h-7 w-7 text-lex-500" /> Compliance rules
            </h1>
            <p className="text-muted-foreground">{rules.length} active rules</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="gradient"><Plus className="h-4 w-4" /> New rule</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create compliance rule</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. NDA Confidentiality Period" /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Contract Essentials", "Data Protection", "IP Rights", "Labour Law", "Tax Compliance"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Severity</Label>
                    <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Regex pattern (optional)</Label><Input value={form.rulePattern} onChange={(e) => setForm({ ...form, rulePattern: e.target.value })} placeholder="e.g. confidential(ity)?" className="font-mono text-xs" /></div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="llm" checked={form.requiresLLM} onChange={(e) => setForm({ ...form, requiresLLM: e.target.checked })} />
                  <Label htmlFor="llm" className="cursor-pointer">Requires LLM evaluation (Phase 2)</Label>
                </div>
                <Button onClick={create} disabled={loading || !form.name} variant="gradient" className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create rule"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          {rules.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
              <GlowCard className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-medium">{r.name}</h3>
                      <Badge variant="outline">{r.category}</Badge>
                      <Badge variant={r.severity === "CRITICAL" ? "destructive" : r.severity === "HIGH" ? "warning" : "outline"}>{r.severity}</Badge>
                      {r.requiresLLM && <Badge variant="info">LLM</Badge>}
                      {!r.requiresLLM && r.rulePattern && <Badge variant="outline">REGEX</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{r.description}</p>
                    {r.rulePattern && <code className="text-xs font-mono mt-1 inline-block bg-muted px-2 py-0.5 rounded">{r.rulePattern}</code>}
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
