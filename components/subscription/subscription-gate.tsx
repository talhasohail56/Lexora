"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { CreditCard, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FEATURE_LABELS,
  type SubscriptionContext,
  canUseFeature,
  featureForPath,
  formatPlanPrice,
  subscriptionBlockReason,
} from "@/lib/subscription-config";

export function SubscriptionGate({
  context,
  children,
}: {
  context: SubscriptionContext;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const feature = featureForPath(pathname);
  const allowed = canUseFeature(context, feature);

  if (allowed) return <>{children}</>;

  const reason = subscriptionBlockReason(context, feature);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-3xl overflow-hidden rounded-lg border bg-card p-8 shadow-soft"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,hsl(var(--primary)),hsl(var(--accent-warm)))]" />
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{FEATURE_LABELS[feature]} is locked</h1>
              <p className="mt-1 text-sm text-muted-foreground">{reason}</p>
            </div>
          </div>
          <Badge variant="outline">{context.plan.name}</Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">Current plan</p>
            <p className="mt-3 text-xl font-semibold">{context.plan.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{formatPlanPrice(context.plan.priceCents)}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">Role</p>
            <p className="mt-3 text-xl font-semibold">{context.role}</p>
            <p className="mt-1 text-sm text-muted-foreground">Access is role-aware</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="mt-3 text-xl font-semibold">{context.status}</p>
            <p className="mt-1 text-sm text-muted-foreground">Billing period enforced</p>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild variant="gradient">
            <Link href="/billing">
              <CreditCard className="h-4 w-4" />
              Upgrade plan
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <Sparkles className="h-4 w-4" />
              Back to dashboard
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
