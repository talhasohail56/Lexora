"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, CheckCircle2, Crown, Loader2, Mail, Plus, Shield, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/animated/page-transition";
import { GlowCard } from "@/components/animated/glow-card";
import { formatRelative } from "@/lib/utils";

type TeamState = {
  workspace: any | null;
  canCreateFirm: boolean;
  firmPlanActive: boolean;
};

export default function TeamPage() {
  const [state, setState] = useState<TeamState | null>(null);
  const [firmName, setFirmName] = useState("");
  const [invite, setInvite] = useState({ email: "", role: "MEMBER" });
  const [loading, setLoading] = useState(false);

  async function load() {
    const response = await fetch("/api/team", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load team");
    setState(data);
    setFirmName(data.workspace?.firm?.name || "");
  }

  useEffect(() => {
    load().catch((error) => toast.error(error.message));
  }, []);

  const firm = state?.workspace?.firm;
  const firmPlanActive = Boolean(state?.workspace?.firmPlanActive);
  const members = firm?.members ?? [];
  const invitations = firm?.invitations ?? [];
  const canManage = Boolean(state?.workspace?.canManage);
  const activeMembers = members.length;

  async function createFirm(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/team/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: firmName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create firm");
      toast.success("Firm workspace created");
      await load();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function inviteMember(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/team/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invite),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not send invite");
      if (data.emailSent) toast.success("Invitation email sent");
      else toast.error(`Invite created but email failed: ${data.emailError || "unknown email error"}`);
      setInvite({ email: "", role: "MEMBER" });
      await load();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (!state) {
    return (
      <PageTransition>
        <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading firm workspace...
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2rem] border bg-[#0d0c09] p-7 text-white shadow-2xl md:p-9"
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:48px_48px] opacity-35" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(140,240,218,0.22),transparent_31%),radial-gradient(circle_at_82%_12%,rgba(214,122,45,0.28),transparent_35%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-[#8ff3d6]">
                <Users className="h-4 w-4" />
                Firm workspace
              </div>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
                {firm ? firm.name : "Create your firm account."}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55">
                {firm && !firmPlanActive
                  ? "This firm workspace is paused because the owner is no longer on the Firm plan."
                  : "Invite colleagues by email, keep firm access separate from personal accounts, and share only the documents each member should see."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
              <Stat label="Members" value={activeMembers} />
              <Stat label="Pending invites" value={invitations.length} />
            </div>
          </div>
        </motion.section>

        {firm && !firmPlanActive ? (
          <GlowCard className="p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Firm workspace paused</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Members and invitations are kept, but team access, invitations, and firm document sharing are disabled until the firm owner upgrades back to the Firm plan.
                </p>
              </div>
            </div>
            <Button asChild variant="gradient">
              <a href="/billing">Reactivate Firm plan</a>
            </Button>
          </GlowCard>
        ) : !firm ? (
          <GlowCard className="p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lex-500/10 text-lex-600">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Set up firm workspace</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Available on the Firm plan. The owner becomes the first firm admin.
                </p>
              </div>
            </div>
            {state.canCreateFirm ? (
              <form onSubmit={createFirm} className="flex flex-col gap-3 sm:flex-row">
                <Input value={firmName} onChange={(e) => setFirmName(e.target.value)} placeholder="Firm name" required />
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Create firm
                </Button>
              </form>
            ) : (
              <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                Switch to the Firm plan in Billing to unlock team invitations and firm-wide document sharing.
              </div>
            )}
          </GlowCard>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.72fr]">
            <section className="space-y-6">
              <GlowCard className="p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Members</h2>
                    <p className="text-sm text-muted-foreground">People who can access firm-shared documents.</p>
                  </div>
                  <Badge variant="outline">{activeMembers} active</Badge>
                </div>
                <div className="space-y-3">
                  {members.map((member: any) => (
                    <div key={member.id} className="flex items-center gap-3 rounded-xl border bg-background/60 p-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-lex-500 to-amber-500 text-sm font-semibold text-white">
                        {member.user.avatarUrl ? (
                          <img src={member.user.avatarUrl} alt={`${member.user.name} profile`} className="h-full w-full object-cover" />
                        ) : (
                          member.user.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="truncate font-medium">{member.user.name}</div>
                          {member.role === "OWNER" ? <Crown className="h-4 w-4 text-amber-500" /> : null}
                          <Badge variant="outline" className="text-[10px]">{member.role}</Badge>
                        </div>
                        <div className="truncate text-xs text-muted-foreground">{member.user.email}</div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        Joined<br />{formatRelative(member.joinedAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </GlowCard>

              <GlowCard className="p-6">
                <h2 className="mb-4 text-xl font-semibold">Pending invitations</h2>
                {invitations.length ? (
                  <div className="space-y-3">
                    {invitations.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border bg-background/60 p-4">
                        <div>
                          <div className="font-medium">{item.email}</div>
                          <div className="text-xs text-muted-foreground">
                            Invited by {item.invitedBy.name} · expires {formatRelative(item.expiresAt)}
                          </div>
                        </div>
                        <Badge variant="warning">{item.role}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No pending invitations.</p>
                )}
              </GlowCard>
            </section>

            <aside className="space-y-6">
              <GlowCard className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-lex-500" />
                  <h2 className="text-xl font-semibold">Invite member</h2>
                </div>
                {canManage ? (
                  <form onSubmit={inviteMember} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={invite.email}
                        onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                        placeholder="colleague@firm.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Firm role</Label>
                      <Select value={invite.role} onValueChange={(role) => setInvite({ ...invite, role })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEMBER">Member</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                      Send invitation
                    </Button>
                  </form>
                ) : (
                  <p className="text-sm text-muted-foreground">Only firm owners and admins can invite members.</p>
                )}
              </GlowCard>

              <GlowCard className="p-6">
                <div className="mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-lex-500" />
                  <h2 className="text-xl font-semibold">Sharing rules</h2>
                </div>
                <div className="space-y-3 text-sm leading-6 text-muted-foreground">
                  <p><CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-500" /> Documents are private by default.</p>
                  <p><CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-500" /> Owners can share a document with one member or the whole firm.</p>
                  <p><CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-500" /> Team members only see documents explicitly shared with them.</p>
                </div>
              </GlowCard>
            </aside>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
      <div className="text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-white/45">{label}</div>
    </div>
  );
}
