"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home, FileText, MessageSquare, Search, ScrollText, Shield, GitCompare,
  Clock, Bell, Users, Gavel, BarChart3, ChevronLeft, BookOpen, Sparkles,
  Activity, Settings, Scale, CreditCard, Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { type SubscriptionContext, canUseFeature, featureForPath } from "@/lib/subscription-config";

const sections: {
  heading: string;
  items: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; admin?: boolean }[];
}[] = [
  {
    heading: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: Home },
    ],
  },
  {
    heading: "Documents",
    items: [
      { href: "/documents", label: "My Documents", icon: FileText },
      { href: "/draft", label: "Draft Contract", icon: ScrollText },
      { href: "/compare", label: "Compare", icon: GitCompare },
      { href: "/timeline", label: "Timeline", icon: Clock },
    ],
  },
  {
    heading: "AI",
    items: [
      { href: "/chat", label: "AI Chat", icon: MessageSquare },
      { href: "/search", label: "Semantic Search", icon: Search },
      { href: "/library", label: "Legal Library", icon: BookOpen },
      { href: "/compliance", label: "Compliance", icon: Shield },
      { href: "/negotiator", label: "Negotiator", icon: Sparkles },
      { href: "/forecast", label: "Court Forecast", icon: Activity },
      { href: "/glossary", label: "Glossary", icon: BookOpen },
    ],
  },
  {
    heading: "Account",
    items: [
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/team", label: "Team", icon: Users },
      { href: "/billing", label: "Billing", icon: CreditCard },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
  {
    heading: "Admin",
    items: [
      { href: "/admin/users", label: "Users", icon: Users, admin: true },
      { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard, admin: true },
      { href: "/admin/rules", label: "Compliance Rules", icon: Gavel, admin: true },
      { href: "/admin/templates", label: "Templates", icon: ScrollText, admin: true },
      { href: "/admin/audit", label: "Audit Replay", icon: BarChart3, admin: true },
    ],
  },
];

export function Sidebar({
  role = "USER",
  subscription,
}: {
  role?: "USER" | "LAWYER" | "ADMIN";
  subscription?: SubscriptionContext;
}) {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="relative h-screen sticky top-0 shrink-0 border-r border-border/80 bg-card/[0.88] backdrop-blur-xl flex flex-col"
    >
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border h-16">
        <div className="relative h-8 w-8 shrink-0">
          <div className="absolute inset-0 rounded-lg bg-[linear-gradient(135deg,hsl(var(--foreground)),hsl(var(--primary))_62%,hsl(var(--accent-warm)))] shadow-soft" />
          <Scale className="relative h-8 w-8 p-1.5 text-white" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col leading-tight"
          >
            <span className="font-bold text-base text-gradient">Lexora</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">AI Paralegal</span>
          </motion.div>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin space-y-4">
        {sections.map((section) => {
          const items = section.items.filter((i) => !i.admin || role === "ADMIN");
          if (!items.length) return null;
          return (
            <div key={section.heading}>
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  {section.heading}
                </p>
              )}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = path === item.href || (item.href !== "/dashboard" && path.startsWith(item.href));
                  const Icon = item.icon;
                  const feature = featureForPath(item.href);
                  const locked = subscription ? !canUseFeature(subscription, feature) : false;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          active
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="sidebar-active"
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute inset-0 rounded-lg border border-primary/20 bg-[linear-gradient(90deg,hsl(var(--primary)/0.12),hsl(var(--accent-warm)/0.10))] -z-10"
                          />
                        )}
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {!collapsed && locked && <Lock className="ml-auto h-3.5 w-3.5 text-muted-foreground" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="m-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-accent"
        aria-label="Toggle sidebar"
      >
        <ChevronLeft
          className={cn("h-3.5 w-3.5 transition-transform", collapsed && "rotate-180")}
        />
        {!collapsed && "Collapse"}
      </button>
    </motion.aside>
  );
}
