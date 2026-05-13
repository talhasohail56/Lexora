"use client";

import * as React from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import {
  FileText, MessageSquare, Search, Sparkles, Shield, ScrollText, Clock,
  Bell, Users, Gavel, Home, Settings, Upload, GitCompare, BookOpen,
  BarChart3, Activity, Mic, CreditCard
} from "lucide-react";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type CtxValue = { open: boolean; setOpen: (v: boolean) => void };
const Ctx = React.createContext<CtxValue>({ open: false, setOpen: () => {} });

export function useCommandPalette() {
  return React.useContext(Ctx);
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  return (
    <Ctx.Provider value={{ open, setOpen }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay />
          <AnimatePresence>
            {open && (
              <DialogPrimitive.Content asChild>
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed left-1/2 top-4 z-50 w-[calc(100vw-1rem)] max-w-xl -translate-x-1/2 sm:top-[20%]"
                >
                  <Command
                    label="Command Menu"
                    className="overflow-hidden rounded-2xl border bg-popover/95 backdrop-blur-2xl shadow-2xl ring-1 ring-black/5"
                  >
                    <div className="flex items-center border-b px-4">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Command.Input
                        autoFocus
                        placeholder="Type a command or search..."
                        className="flex h-12 w-full bg-transparent py-3 pl-3 text-sm outline-none placeholder:text-muted-foreground"
                      />
                      <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                        ESC
                      </kbd>
                    </div>
                    <Command.List className="max-h-80 overflow-y-auto p-2 scrollbar-thin">
                      <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                        No results found.
                      </Command.Empty>

                      <Group heading="Navigation">
                        <Item icon={Home} label="Dashboard" hint="Go to dashboard" onSelect={() => go("/dashboard")} />
                        <Item icon={FileText} label="My Documents" onSelect={() => go("/documents")} />
                        <Item icon={Upload} label="Upload Document" onSelect={() => go("/documents/upload")} />
                        <Item icon={MessageSquare} label="AI Chat" onSelect={() => go("/chat")} />
                        <Item icon={Search} label="Semantic Search" onSelect={() => go("/search")} />
                        <Item icon={BookOpen} label="Pakistan Legal Library" onSelect={() => go("/library")} />
                        <Item icon={ScrollText} label="Draft Contract" onSelect={() => go("/draft")} />
                        <Item icon={Shield} label="Compliance" onSelect={() => go("/compliance")} />
                        <Item icon={GitCompare} label="Compare Documents" onSelect={() => go("/compare")} />
                        <Item icon={Clock} label="Timeline" onSelect={() => go("/timeline")} />
                        <Item icon={Bell} label="Notifications" onSelect={() => go("/notifications")} />
                        <Item icon={Users} label="Team Workspace" onSelect={() => go("/team")} />
                        <Item icon={CreditCard} label="Billing" onSelect={() => go("/billing")} />
                      </Group>

                      <Group heading="AI Features">
                        <Item icon={Sparkles} label="Negotiation Simulator" onSelect={() => go("/negotiator")} />
                        <Item icon={Activity} label="Court Forecast" onSelect={() => go("/forecast")} />
                        <Item icon={BookOpen} label="Legal Glossary" onSelect={() => go("/glossary")} />
                        <Item icon={Mic} label="Voice Brief" onSelect={() => go("/voice-brief")} />
                      </Group>

                      <Group heading="Admin">
                        <Item icon={Users} label="User Management" onSelect={() => go("/admin/users")} />
                        <Item icon={CreditCard} label="Subscriptions" onSelect={() => go("/admin/subscriptions")} />
                        <Item icon={Gavel} label="Compliance Rules" onSelect={() => go("/admin/rules")} />
                        <Item icon={BarChart3} label="Audit Replay" onSelect={() => go("/admin/audit")} />
                        <Item icon={Settings} label="Settings" onSelect={() => go("/settings")} />
                      </Group>
                    </Command.List>
                  </Command>
                </motion.div>
              </DialogPrimitive.Content>
            )}
          </AnimatePresence>
        </DialogPortal>
      </Dialog>
    </Ctx.Provider>
  );
}

function Group({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <Command.Group heading={heading} className="text-xs text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium">
      {children}
    </Command.Group>
  );
}

function Item({
  icon: Icon,
  label,
  hint,
  onSelect,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  onSelect?: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground aria-selected:bg-accent cursor-pointer"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1">{label}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </Command.Item>
  );
}
