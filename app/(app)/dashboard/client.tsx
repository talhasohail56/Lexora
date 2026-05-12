"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { FileText, MessageSquare, Bell, AlertCircle, ArrowUpRight, Plus, Sparkles, ScrollText, Shield, GitCompare } from "lucide-react";
import { GlowCard } from "@/components/animated/glow-card";
import { Stagger, StaggerItem } from "@/components/animated/scroll-reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageTransition } from "@/components/animated/page-transition";
import { AnimatedCounter } from "@/components/animated/animated-counter";
import { formatRelative, severityColor } from "@/lib/utils";
import {
  RadialBar, RadialBarChart, ResponsiveContainer, PolarAngleAxis,
} from "recharts";

export function DashboardClient({
  session,
  stats,
  recent,
}: {
  session: { name: string; role: string };
  stats: { docCount: number; avgRisk: number; notifications: number; chatSessions: number };
  recent: { id: string; name: string; status: string; risk: number; type: string; clauses: number; risks: number; createdAt: string }[];
}) {
  const router = useRouter();
  const tiles = useMemo(() => [
    { icon: FileText,      label: "Documents",       value: stats.docCount,      href: "/documents",   color: "from-lex-500 to-cyan-500" },
    { icon: AlertCircle,   label: "Avg risk score",  value: stats.avgRisk,        suffix: "/100",       href: "/documents",   color: "from-amber-500 to-orange-500" },
    { icon: MessageSquare, label: "Chat sessions",   value: stats.chatSessions,  href: "/chat",        color: "from-amber-500 to-rose-500" },
    { icon: Bell,          label: "Unread alerts",   value: stats.notifications, href: "/notifications", color: "from-emerald-500 to-teal-500" },
  ], [stats.avgRisk, stats.chatSessions, stats.docCount, stats.notifications]);

  const quickActions = useMemo(() => [
    { icon: Plus,        label: "Upload a contract", desc: "PDF or DOCX up to 20 MB",         href: "/documents/upload", color: "from-lex-500 to-amber-500" },
    { icon: MessageSquare, label: "Ask AI",           desc: "Get answers grounded in your docs", href: "/chat", color: "from-sky-500 to-indigo-500" },
    { icon: ScrollText,  label: "Draft a contract",  desc: "Generate from templates",          href: "/draft", color: "from-emerald-500 to-teal-500" },
    { icon: Shield,      label: "Compliance check",  desc: "Run hybrid regex + LLM eval",      href: "/compliance", color: "from-amber-500 to-orange-500" },
    { icon: GitCompare,  label: "Compare docs",      desc: "2-way or 3-way diff",              href: "/compare", color: "from-emerald-600 to-rose-500" },
    { icon: Sparkles,    label: "Negotiate",         desc: "AI opposing counsel",              href: "/negotiator", color: "from-rose-500 to-red-500" },
  ], []);

  useEffect(() => {
    const hrefs = Array.from(new Set([
      ...tiles.map((item) => item.href),
      ...quickActions.map((item) => item.href),
      ...recent.slice(0, 3).map((item) => `/documents/${item.id}`),
      "/billing",
      "/settings",
    ]));

    const prefetch = () => hrefs.forEach((href) => router.prefetch(href));
    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(prefetch, { timeout: 1600 });
      return () => window.cancelIdleCallback(idleId);
    }
    const timeoutId = globalThis.setTimeout(prefetch, 450);
    return () => globalThis.clearTimeout(timeoutId);
  }, [quickActions, recent, router, tiles]);

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Good to see you, <span className="text-gradient">{session.name.split(" ")[0]}</span>.
          </h1>
          <p className="mt-1 text-muted-foreground">Here is what is happening across your legal workspace.</p>
        </motion.div>

        {/* Tiles */}
        <Stagger>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiles.map((t) => (
              <StaggerItem key={t.label}>
                <Link href={t.href}>
                  <GlowCard className="p-5 h-full">
                    <div className="flex items-start justify-between">
                      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${t.color} text-white shadow-glow`}>
                        <t.icon className="h-4 w-4" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="mt-4 text-3xl font-bold tracking-tight">
                      <AnimatedCounter value={t.value} suffix={t.suffix} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{t.label}</div>
                  </GlowCard>
                </Link>
              </StaggerItem>
            ))}
          </div>
        </Stagger>

        {/* Risk gauge + Quick actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <GlowCard className="p-6 lg:col-span-1">
            <div className="text-sm text-muted-foreground mb-3">Portfolio risk</div>
            <div className="relative h-44">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ name: "risk", value: stats.avgRisk, fill: "url(#gradRisk)" }]} startAngle={90} endAngle={-270}>
                  <defs>
                    <linearGradient id="gradRisk" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#1f49f5" />
                      <stop offset="50%" stopColor="#d946ef" />
                      <stop offset="100%" stopColor="#f43f5e" />
                    </linearGradient>
                  </defs>
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar background={{ fill: "hsl(var(--muted))" }} dataKey="value" cornerRadius={20} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl font-bold text-gradient">
                  <AnimatedCounter value={stats.avgRisk} />
                </div>
                <div className="text-xs text-muted-foreground">aggregate / 100</div>
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              Computed from severity weighting (CRITICAL×25 + HIGH×10 + MEDIUM×5 + LOW×2).
            </div>
          </GlowCard>

          <GlowCard className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium">Quick actions</div>
              <Badge variant="outline">⌘K for everything</Badge>
            </div>
            <Stagger stagger={0.05}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {quickActions.map((qa) => (
                  <StaggerItem key={qa.href}>
                    <Link
                      href={qa.href}
                      className="group flex items-start gap-3 p-3 rounded-lg border border-border bg-card/40 hover:bg-accent/60 transition-colors"
                    >
                      <div className={`h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br ${qa.color} flex items-center justify-center text-white shadow-soft`}>
                        <qa.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm flex items-center gap-1">
                          {qa.label} <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-xs text-muted-foreground">{qa.desc}</div>
                      </div>
                    </Link>
                  </StaggerItem>
                ))}
              </div>
            </Stagger>
          </GlowCard>
        </div>

        {/* Recent docs */}
        <GlowCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">Recent documents</h2>
              <p className="text-xs text-muted-foreground">Your last 5 uploads</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/documents">View all <ArrowUpRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </div>
          {recent.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-lex-500/20 to-amber-500/20 flex items-center justify-center mb-3">
                <FileText className="h-5 w-5 text-lex-500" />
              </div>
              <div className="font-medium">No documents yet</div>
              <div className="text-xs text-muted-foreground mt-1 mb-4">Upload your first contract to see analysis here.</div>
              <Button variant="gradient" asChild>
                <Link href="/documents/upload"><Plus className="h-4 w-4" /> Upload document</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recent.map((d) => (
                <Link
                  key={d.id}
                  href={`/documents/${d.id}`}
                  className="flex items-center gap-4 py-3 hover:bg-accent/30 -mx-3 px-3 rounded-md transition-colors group"
                >
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-lex-500/15 to-amber-500/15 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-lex-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{d.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {d.type} · {d.clauses} clauses · {d.risks} risks · {formatRelative(d.createdAt)}
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    {d.status === "COMPLETED" ? (
                      <div className="w-32">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                          <span>Risk</span><span>{d.risk}/100</span>
                        </div>
                        <Progress value={d.risk} />
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs">{d.status}</Badge>
                    )}
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          )}
        </GlowCard>
      </div>
    </PageTransition>
  );
}
