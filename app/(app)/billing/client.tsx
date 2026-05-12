"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Check, CreditCard, Loader2, Shield, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FEATURE_LABELS,
  type AppRole,
  type DefaultPlan,
  type SubscriptionContext,
  type SubscriptionFeature,
  formatPlanPrice,
  isLimitUnlimited,
} from "@/lib/subscription-config";

type PlanFromApi = DefaultPlan & { id?: string; isActive?: boolean };

const usageFeatures: SubscriptionFeature[] = [
  "documents",
  "chatMessages",
  "semanticSearches",
  "drafts",
  "complianceRuns",
  "comparisons",
  "annotations",
];

export function BillingClient({
  subscription,
  plans,
  role,
}: {
  subscription: SubscriptionContext;
  plans: PlanFromApi[];
  role: string;
}) {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  async function switchPlan(planCode: string) {
    setLoadingPlan(planCode);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update plan");
      toast.success(`Plan switched to ${data.planName}`);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoadingPlan(null);
    }
  }

  const eligiblePlans = plans.filter((plan) => {
    if (role === "ADMIN") return true;
    return plan.audienceRole === "ALL" || plan.audienceRole === role;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="gradient" className="mb-3">Subscription</Badge>
          <h1 className="text-3xl font-bold">Billing & access control</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Your plan controls feature access, monthly usage and role-specific tools across the whole site.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-right">
          <p className="text-xs text-muted-foreground">Current plan</p>
          <p className="mt-1 text-xl font-semibold">{subscription.plan.name}</p>
          <p className="text-sm text-muted-foreground">{subscription.status}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border bg-card p-6 shadow-soft"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Current entitlement</h2>
              <p className="text-sm text-muted-foreground">Plan, status and billing period</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Plan" value={subscription.plan.name} />
            <Metric label="Price" value={formatPlanPrice(subscription.plan.priceCents)} />
            <Metric label="Role" value={subscription.role} />
            <Metric label="Status" value={subscription.status} />
          </div>
          <div className="mt-5 rounded-lg border bg-muted/30 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4 text-primary" />
              Role-aware gates
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Admin bypasses every gate. Lawyer-only tools require a lawyer account and a lawyer-capable plan.
              Usage-heavy features are counted per billing period.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-lg border bg-card p-6 shadow-soft"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Usage this period</h2>
              <p className="text-sm text-muted-foreground">Live limits enforced by APIs</p>
            </div>
          </div>
          <div className="space-y-4">
            {usageFeatures.map((feature) => {
              const limit = subscription.plan.limits[feature];
              if (limit === undefined || limit === false) return null;
              const used = subscription.usage[feature] ?? 0;
              const unlimited = isLimitUnlimited(limit);
              const max = typeof limit === "number" ? limit : 1;
              const pct = unlimited ? 0 : Math.min(100, Math.round((used / max) * 100));
              return (
                <div key={feature}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span>{FEATURE_LABELS[feature]}</span>
                    <span className="text-muted-foreground">
                      {unlimited ? `${used} / unlimited` : `${used} / ${limit}`}
                    </span>
                  </div>
                  <Progress value={unlimited ? 100 : pct} />
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {eligiblePlans.map((plan) => {
          const active = plan.code === subscription.plan.code;
          return (
            <motion.div
              key={plan.code}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex min-h-[420px] flex-col rounded-lg border bg-card p-5 shadow-soft ${active ? "border-primary/50 ring-2 ring-primary/10" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{plan.audienceRole}</p>
                  <h3 className="mt-2 text-xl font-semibold">{plan.name}</h3>
                </div>
                {active && <Badge>Active</Badge>}
              </div>
              <p className="mt-5 text-3xl font-bold">{formatPlanPrice(plan.priceCents)}</p>
              <p className="mt-3 min-h-16 text-sm leading-6 text-muted-foreground">{plan.description}</p>
              <div className="mt-5 space-y-2">
                {plan.features.slice(0, 7).map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    {FEATURE_LABELS[feature] ?? feature}
                  </div>
                ))}
              </div>
              <Button
                className="mt-auto"
                variant={active ? "outline" : "gradient"}
                disabled={active || !!loadingPlan}
                onClick={() => switchPlan(plan.code)}
              >
                {loadingPlan === plan.code ? <Loader2 className="h-4 w-4 animate-spin" /> : active ? "Current plan" : "Switch plan"}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}
