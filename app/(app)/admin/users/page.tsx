"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Edit3, Loader2, Search, ShieldCheck, Users } from "lucide-react";
import { GlowCard } from "@/components/animated/glow-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/animated/page-transition";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatRelative } from "@/lib/utils";
import { formatPlanPrice } from "@/lib/subscription-config";
import { toast } from "sonner";

type Plan = {
  id: string;
  code: string;
  name: string;
  audienceRole: "USER" | "LAWYER" | "ADMIN" | "ALL";
  priceCents: number;
  billingInterval: string;
};

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "LAWYER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  isVerified: boolean;
  onboardingComplete: boolean;
  organization: string | null;
  jurisdiction: string | null;
  barNumber: string | null;
  persona: string | null;
  practiceArea: string | null;
  primaryUseCase: string | null;
  preferredTone: string | null;
  avatarUrl: string | null;
  createdAt: string;
  subscriptions: {
    id: string;
    status: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED";
    currentPeriodEnd: string;
    provider: string;
    plan: Plan;
  }[];
};

const roles = ["USER", "LAWYER", "ADMIN"] as const;
const accountStatuses = ["ACTIVE", "SUSPENDED", "BANNED"] as const;
const subscriptionStatuses = ["TRIALING", "ACTIVE", "PAST_DUE", "CANCELED", "EXPIRED"] as const;

function planRolePatch(user: UserRow, plan?: Plan) {
  if (!plan || plan.audienceRole === "ALL" || plan.audienceRole === "ADMIN") return {};
  return user.role === plan.audienceRole ? {} : { role: plan.audienceRole };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [draft, setDraft] = useState<Record<string, any>>({});

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    const data = await fetch("/api/admin/users", { cache: "no-store" }).then((r) => r.json());
    if (Array.isArray(data)) {
      setUsers(data);
      return;
    }
    setUsers(data.users || []);
    setPlans(data.plans || []);
  }

  async function patchUser(id: string, payload: Record<string, unknown>, success: string) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Admin update failed");
      toast.success(success);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Admin update failed");
    } finally {
      setSavingId(null);
    }
  }

  async function changePlan(user: UserRow, planCode: string) {
    const plan = plans.find((p) => p.code === planCode);
    await patchUser(
      user.id,
      { planCode, subscriptionStatus: "ACTIVE", ...planRolePatch(user, plan) },
      `Plan changed to ${plan?.name || planCode}`
    );
  }

  function openEditor(user: UserRow) {
    setEditing(user);
    setDraft({
      name: user.name,
      email: user.email,
      organization: user.organization || "",
      jurisdiction: user.jurisdiction || "",
      barNumber: user.barNumber || "",
      persona: user.persona || "",
      practiceArea: user.practiceArea || "",
      primaryUseCase: user.primaryUseCase || "",
      preferredTone: user.preferredTone || "",
      avatarUrl: user.avatarUrl || "",
      isVerified: user.isVerified,
      onboardingComplete: user.onboardingComplete,
    });
  }

  async function saveProfile() {
    if (!editing) return;
    await patchUser(editing.id, draft, "Profile updated");
    setEditing(null);
  }

  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          (roleFilter === "ALL" || u.role === roleFilter) &&
          (!q ||
            u.email.toLowerCase().includes(q.toLowerCase()) ||
            u.name.toLowerCase().includes(q.toLowerCase()) ||
            (u.organization || "").toLowerCase().includes(q.toLowerCase()))
      ),
    [users, q, roleFilter]
  );

  return (
    <PageTransition>
      <div className="space-y-6 max-w-[1500px]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-7 w-7 text-lex-500" /> User management
            </h1>
            <p className="text-muted-foreground">
              Full admin control for role, account status, plan, subscription state and profile data.
            </p>
          </div>
          <Badge variant="gradient" className="w-fit gap-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            {users.length} accounts
          </Badge>
        </div>

        <GlowCard className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-xl flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, email or firm"
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {["ALL", ...roles].map((r) => (
                <Button key={r} variant={roleFilter === r ? "default" : "outline"} size="sm" onClick={() => setRoleFilter(r)}>
                  {r}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[1180px] text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="p-3 font-medium">User</th>
                  <th className="p-3 font-medium">Role</th>
                  <th className="p-3 font-medium">Plan</th>
                  <th className="p-3 font-medium">Subscription</th>
                  <th className="p-3 font-medium">Account</th>
                  <th className="p-3 font-medium">Flags</th>
                  <th className="p-3 font-medium">Joined</th>
                  <th className="p-3 font-medium">Edit</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const sub = u.subscriptions[0];
                  const saving = savingId === u.id;
                  return (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.015 }}
                      className="border-t border-border hover:bg-accent/30"
                    >
                      <td className="p-3">
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                        {u.organization ? <div className="text-xs text-muted-foreground">{u.organization}</div> : null}
                      </td>
                      <td className="p-3">
                        <Select
                          value={u.role}
                          disabled={saving}
                          onValueChange={(role) => patchUser(u.id, { role }, "Role updated")}
                        >
                          <SelectTrigger className="h-9 w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <Select value={sub?.plan?.code || ""} disabled={saving || !plans.length} onValueChange={(plan) => changePlan(u, plan)}>
                          <SelectTrigger className="h-9 w-[210px]">
                            <SelectValue placeholder="Assign plan" />
                          </SelectTrigger>
                          <SelectContent>
                            {plans.map((plan) => (
                              <SelectItem key={plan.code} value={plan.code}>
                                {plan.name} - {formatPlanPrice(plan.priceCents)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <Select
                          value={sub?.status || "ACTIVE"}
                          disabled={saving || !sub}
                          onValueChange={(subscriptionStatus) =>
                            patchUser(u.id, { subscriptionStatus }, "Subscription status updated")
                          }
                        >
                          <SelectTrigger className="h-9 w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {subscriptionStatuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <Select
                          value={u.status}
                          disabled={saving}
                          onValueChange={(status) => patchUser(u.id, { status }, "Account status updated")}
                        >
                          <SelectTrigger className="h-9 w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {accountStatuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1.5">
                          <Button
                            size="sm"
                            variant={u.isVerified ? "secondary" : "outline"}
                            disabled={saving}
                            onClick={() => patchUser(u.id, { isVerified: !u.isVerified }, "Verification updated")}
                          >
                            {u.isVerified ? "Verified" : "Verify"}
                          </Button>
                          <Button
                            size="sm"
                            variant={u.onboardingComplete ? "secondary" : "outline"}
                            disabled={saving}
                            onClick={() =>
                              patchUser(u.id, { onboardingComplete: !u.onboardingComplete }, "Setup flag updated")
                            }
                          >
                            {u.onboardingComplete ? "Setup done" : "Needs setup"}
                          </Button>
                        </div>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{formatRelative(u.createdAt)}</td>
                      <td className="p-3">
                        <Button size="sm" variant="ghost" disabled={saving} onClick={() => openEditor(u)}>
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit3 className="h-4 w-4" />}
                          Edit
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlowCard>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit account profile</DialogTitle>
            <DialogDescription>
              Admin changes apply immediately and are recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name" value={draft.name} onChange={(name) => setDraft((d) => ({ ...d, name }))} />
            <Field label="Email" value={draft.email} onChange={(email) => setDraft((d) => ({ ...d, email }))} />
            <Field label="Organization / firm" value={draft.organization} onChange={(organization) => setDraft((d) => ({ ...d, organization }))} />
            <Field label="Jurisdiction" value={draft.jurisdiction} onChange={(jurisdiction) => setDraft((d) => ({ ...d, jurisdiction }))} />
            <Field label="Bar number" value={draft.barNumber} onChange={(barNumber) => setDraft((d) => ({ ...d, barNumber }))} />
            <Field label="Practice area" value={draft.practiceArea} onChange={(practiceArea) => setDraft((d) => ({ ...d, practiceArea }))} />
            <Field label="Primary use case" value={draft.primaryUseCase} onChange={(primaryUseCase) => setDraft((d) => ({ ...d, primaryUseCase }))} />
            <Field label="Response style" value={draft.preferredTone} onChange={(preferredTone) => setDraft((d) => ({ ...d, preferredTone }))} />
            <div className="md:col-span-2">
              <Field label="Profile picture URL" value={draft.avatarUrl} onChange={(avatarUrl) => setDraft((d) => ({ ...d, avatarUrl }))} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Persona / workspace notes</Label>
              <Textarea
                value={draft.persona || ""}
                onChange={(e) => setDraft((d) => ({ ...d, persona: e.target.value }))}
                placeholder="How Lexora should personalize the experience for this user"
                className="min-h-28"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <Button
              type="button"
              variant={draft.isVerified ? "secondary" : "outline"}
              onClick={() => setDraft((d) => ({ ...d, isVerified: !d.isVerified }))}
            >
              {draft.isVerified ? "Verified account" : "Mark verified"}
            </Button>
            <Button
              type="button"
              variant={draft.onboardingComplete ? "secondary" : "outline"}
              onClick={() => setDraft((d) => ({ ...d, onboardingComplete: !d.onboardingComplete }))}
            >
              {draft.onboardingComplete ? "Onboarding complete" : "Needs onboarding"}
            </Button>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setEditing(null)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={saveProfile} disabled={!editing || savingId === editing.id} className="w-full sm:w-auto">
              {editing && savingId === editing.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
