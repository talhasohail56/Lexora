"use client";

import { Command, Search, Sun, Moon, LogOut, Bell, User, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCommandPalette } from "./command-palette";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { type SubscriptionContext } from "@/lib/subscription-config";

export function Topbar({
  user,
  subscription,
}: {
  user: { name: string; email: string; role: string; avatarUrl?: string | null };
  subscription?: SubscriptionContext;
}) {
  const { setOpen } = useCommandPalette();
  const { theme, setTheme } = useTheme();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/notifications/unread")
      .then((r) => r.json())
      .then((d) => setUnread(d.count ?? 0))
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border/80 bg-background/[0.82] backdrop-blur-xl flex items-center px-6 gap-4">
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2 px-3 h-9 rounded-md border border-border bg-card/70 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors w-full max-w-md shadow-sm"
      >
        <Search className="h-4 w-4" />
        <span className="text-sm">Search anything...</span>
        <kbd className="ml-auto hidden md:flex items-center gap-0.5 text-[10px] font-medium border border-border rounded px-1.5 py-0.5 bg-muted">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>
      <div className="flex-1" />
      {subscription && (
        <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
          <Link href="/billing">
            <CreditCard className="h-4 w-4" />
            {subscription.plan.name}
          </Link>
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        <Sun className="h-4 w-4 dark:hidden" />
        <Moon className="h-4 w-4 hidden dark:block" />
      </Button>
      <Button variant="ghost" size="icon" asChild className="relative">
        <Link href="/notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1 right-1 h-4 min-w-[1rem] px-1 rounded-full bg-red-500 text-[10px] font-semibold text-white flex items-center justify-center"
            >
              {unread}
            </motion.span>
          )}
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Avatar>
              {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={`${user.name} profile picture`} className="object-cover" /> : null}
              <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col">
            <span>{user.name}</span>
            <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
            <span className="text-[10px] uppercase tracking-wider text-lex-500 mt-1">{user.role}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings"><User className="h-4 w-4" /> Profile & Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/api/auth/logout"><LogOut className="h-4 w-4" /> Logout</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
