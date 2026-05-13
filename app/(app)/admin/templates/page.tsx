"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ScrollText, Plus } from "lucide-react";
import { GlowCard } from "@/components/animated/glow-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageTransition } from "@/components/animated/page-transition";
import { toast } from "sonner";

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "NDA", jurisdiction: "GENERIC", promptText: "" });

  useEffect(() => { refresh(); }, []);
  async function refresh() { setTemplates(await fetch("/api/admin/templates").then((r) => r.json())); }

  async function create() {
    const r = await fetch("/api/admin/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (r.ok) { toast.success("Template added"); setOpen(false); refresh(); }
    else toast.error("Failed");
  }

  return (
    <PageTransition>
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <ScrollText className="h-7 w-7 text-lex-500" /> Legal templates
            </h1>
            <p className="text-muted-foreground">{templates.length} template prompts</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="gradient" className="w-full sm:w-auto"><Plus className="h-4 w-4" /> New template</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add template</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
                <div><Label>System prompt</Label><Textarea rows={5} value={form.promptText} onChange={(e) => setForm({ ...form, promptText: e.target.value })} /></div>
                <Button onClick={create} variant="gradient" className="w-full">Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
              <GlowCard className="p-4 h-full">
                <Badge variant="info" className="mb-2">{t.category}</Badge>
                <h3 className="font-medium">{t.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{t.promptText}</p>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
