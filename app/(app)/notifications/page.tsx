"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Check, Sparkles } from "lucide-react";
import { GlowCard } from "@/components/animated/glow-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/animated/page-transition";
import { formatRelative } from "@/lib/utils";

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => { refresh(); }, []);
  async function refresh() {
    const r = await fetch("/api/notifications");
    setItems(await r.json());
  }
  async function markAll() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    refresh();
  }
  async function markOne(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    refresh();
  }

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Bell className="h-7 w-7 text-lex-500" /> Notifications
            </h1>
            <p className="text-muted-foreground">All your in-app alerts and updates.</p>
          </div>
          <Button onClick={markAll} variant="outline" size="sm"><Check className="h-3.5 w-3.5" /> Mark all read</Button>
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {items.length === 0 && (
              <GlowCard className="p-10 text-center">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-lex-500/20 to-amber-500/20 flex items-center justify-center mb-3">
                  <BellOff className="h-5 w-5 text-lex-500" />
                </div>
                <p className="text-sm text-muted-foreground">You're all caught up.</p>
              </GlowCard>
            )}
            {items.map((n) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 50 }}
              >
                <GlowCard className={`p-4 ${n.isRead ? "opacity-60" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br from-lex-500 to-amber-500 flex items-center justify-center text-white">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-medium">{n.title}</div>
                        <Badge variant={n.priority === "HIGH" ? "destructive" : n.priority === "MEDIUM" ? "warning" : "outline"}>{n.priority}</Badge>
                        {!n.isRead && <Badge variant="gradient" className="text-[10px]">NEW</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{n.body}</p>
                      <div className="text-[10px] text-muted-foreground mt-1">{formatRelative(n.createdAt)} · {n.type}</div>
                    </div>
                    {!n.isRead && (
                      <Button variant="ghost" size="sm" onClick={() => markOne(n.id)}>Mark read</Button>
                    )}
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
