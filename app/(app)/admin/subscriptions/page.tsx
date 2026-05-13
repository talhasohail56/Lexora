"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { PageTransition } from "@/components/animated/page-transition";
import { GlowCard } from "@/components/animated/glow-card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default function AdminSubscriptionsPage() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/subscriptions")
      .then((r) => r.json())
      .then((d) => setRows(d.subscriptions || []))
      .catch(() => setRows([]));
  }, []);

  return (
    <PageTransition>
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-primary" />
            Subscriptions
          </h1>
          <p className="mt-2 text-muted-foreground">Plan, role and billing status across all users.</p>
        </div>
      </div>

      <GlowCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <div className="grid min-w-[760px] grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.8fr] border-b bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>User</span>
            <span>Role</span>
            <span>Plan</span>
            <span>Status</span>
            <span>Renews</span>
          </div>
          {rows.map((row) => (
            <div key={row.id} className="grid min-w-[760px] grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.8fr] items-center border-b px-5 py-4 text-sm last:border-b-0">
              <div>
                <p className="font-medium">{row.user?.name}</p>
                <p className="text-xs text-muted-foreground">{row.user?.email}</p>
              </div>
              <Badge variant={row.user?.role === "LAWYER" ? "info" : "outline"}>{row.user?.role}</Badge>
              <span>{row.plan?.name}</span>
              <Badge variant={row.status === "ACTIVE" || row.status === "TRIALING" ? "default" : "destructive"}>{row.status}</Badge>
              <span className="text-muted-foreground">{formatDate(row.currentPeriodEnd)}</span>
            </div>
          ))}
        </div>
      </GlowCard>
    </PageTransition>
  );
}
