"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Briefcase, Camera, Check, CreditCard, Edit3, Loader2, Scale, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageTransition } from "@/components/animated/page-transition";
import { cn } from "@/lib/utils";

type Profile = {
  name: string;
  email: string;
  role: string;
  status: string;
  avatarUrl: string | null;
  onboardingComplete: boolean;
  organization: string | null;
  jurisdiction: string | null;
  barNumber: string | null;
  persona: string | null;
  practiceArea: string | null;
  primaryUseCase: string | null;
  preferredTone: string | null;
  profileSummary: string | null;
};

type SubscriptionSummary = {
  planName: string;
  status: string;
};

const lawyerAreas = ["Corporate", "Litigation", "Property", "Family", "Tax", "Employment", "General practice"];
const userPersonas = ["Startup founder", "Business owner", "Student", "Freelancer", "Tenant / landlord", "Employee", "Other"];
const tones = ["Precise and formal", "Plain English", "Court-ready", "Business-friendly", "Detailed with citations"];

export function ProfileSettingsClient({
  initialProfile,
  subscription,
}: {
  initialProfile: Profile;
  subscription: SubscriptionSummary;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [editing, setEditing] = useState(!initialProfile.onboardingComplete);
  const [saving, setSaving] = useState(false);
  const isLawyer = profile.role === "LAWYER";
  const initials = profile.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "LX";
  const [form, setForm] = useState({
    name: profile.name,
    avatarUrl: profile.avatarUrl ?? "",
    organization: profile.organization ?? "",
    jurisdiction: profile.jurisdiction ?? "Pakistan",
    barNumber: profile.barNumber ?? "",
    persona: profile.persona ?? (isLawyer ? "Practicing lawyer" : "Startup founder"),
    practiceArea: profile.practiceArea ?? (isLawyer ? "Corporate" : ""),
    primaryUseCase: profile.primaryUseCase ?? "",
    preferredTone: profile.preferredTone ?? "Detailed with citations",
  });

  const roleCopy = useMemo(() => {
    if (isLawyer) {
      return {
        eyebrow: "Counsel profile",
        title: "Lexora supports your legal work without replacing your judgment.",
        body:
          "Your profile tunes chat, drafts, retrieval and dashboard language around your practice. The product should feel like preparation support, not a substitute for counsel.",
        orgLabel: "Firm / chamber",
        focusLabel: "Practice area",
        personaLabel: "Professional role",
        icon: Briefcase,
      };
    }
    return {
      eyebrow: "Client profile",
      title: "Lexora adapts to the legal matter you are handling.",
      body:
        "Your profile helps the workspace explain documents in your context, draft in the right tone, and keep advice grounded in Pakistan-focused sources.",
      orgLabel: "Company / organization",
      focusLabel: "Legal focus",
      personaLabel: "Using Lexora as",
      icon: UserRound,
    };
  }, [isLawyer]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/profile/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update profile");
      setProfile((current) => ({ ...current, ...data.user }));
      setEditing(false);
      toast.success("Profile updated");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Could not update profile");
    } finally {
      setSaving(false);
    }
  }

  function openEditor() {
    setForm({
      name: profile.name,
      avatarUrl: profile.avatarUrl ?? "",
      organization: profile.organization ?? "",
      jurisdiction: profile.jurisdiction ?? "Pakistan",
      barNumber: profile.barNumber ?? "",
      persona: profile.persona ?? (isLawyer ? "Practicing lawyer" : "Startup founder"),
      practiceArea: profile.practiceArea ?? (isLawyer ? "Corporate" : ""),
      primaryUseCase: profile.primaryUseCase ?? "",
      preferredTone: profile.preferredTone ?? "Detailed with citations",
    });
    setEditing(true);
  }

  function setAvatarFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file for the profile picture");
      return;
    }
    if (file.size > 900 * 1024) {
      toast.error("Profile picture must be under 900 KB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, avatarUrl: String(reader.result || "") }));
    };
    reader.onerror = () => toast.error("Could not read that image");
    reader.readAsDataURL(file);
  }

  const Icon = roleCopy.icon;
  const formAvatarIsUpload = form.avatarUrl.startsWith("data:image/");

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[1.5rem] border bg-[#0c0b08] p-5 text-white shadow-2xl sm:rounded-[2rem] md:p-8"
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(140,240,218,0.20),transparent_30%),radial-gradient(circle_at_88%_12%,rgba(214,122,45,0.24),transparent_35%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-4 min-[460px]:flex-row min-[460px]:items-start sm:gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.08] text-2xl font-bold shadow-[0_20px_80px_rgba(0,0,0,0.32)]">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={`${profile.name} profile picture`} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-[#8ff3d6]">
                  <Icon className="h-4 w-4" />
                  {roleCopy.eyebrow}
                </div>
                <h1 className="max-w-3xl break-words text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">{profile.name}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">{roleCopy.title}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Badge className="border-white/10 bg-white/[0.08] text-white hover:bg-white/[0.08]">
                {profile.role}
              </Badge>
              <Badge className="border-white/10 bg-white/[0.08] text-white hover:bg-white/[0.08]">
                {profile.jurisdiction || "Pakistan"}
              </Badge>
              <Button
                type="button"
                onClick={() => (editing ? setEditing(false) : openEditor())}
                className="w-full rounded-full bg-white text-[#080806] hover:bg-white/90 sm:w-auto"
              >
                <Edit3 className="h-4 w-4" />
                {editing ? "Close editor" : "Edit profile"}
              </Button>
            </div>
          </div>
        </motion.section>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.76fr]">
          <section className="space-y-6">
            <form onSubmit={save} className="rounded-2xl border bg-card p-4 shadow-soft sm:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Sparkles className="h-5 w-5 text-lex-500" />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{editing ? "Edit workspace identity" : "Workspace identity"}</h2>
                  {editing ? (
                    <p className="mt-1 text-sm text-muted-foreground">Changes here personalize chat, drafts, and dashboard copy.</p>
                  ) : null}
                </div>
                {editing ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button type="button" variant="outline" onClick={() => setEditing(false)} className="w-full sm:w-auto">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" onClick={openEditor} className="w-full sm:w-auto">
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>
              <p className="mb-5 text-sm leading-6 text-muted-foreground">{roleCopy.body}</p>

              {editing ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Profile picture (optional)" className="sm:col-span-2">
                    <div className="flex flex-col gap-3 rounded-xl border bg-background/50 p-4 sm:flex-row sm:items-center">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-muted text-lg font-semibold">
                        {form.avatarUrl ? (
                          <img src={form.avatarUrl} alt="Profile preview" className="h-full w-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="grid min-w-0 flex-1 gap-2">
                        <Input
                          value={formAvatarIsUpload ? "Uploaded image selected" : form.avatarUrl}
                          onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
                          readOnly={formAvatarIsUpload}
                          placeholder="Paste an image URL, or upload one below"
                        />
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                          <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent">
                            <Camera className="h-4 w-4" />
                            Upload image
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/gif"
                              className="sr-only"
                              onChange={(e) => setAvatarFile(e.target.files?.[0])}
                            />
                          </label>
                          {form.avatarUrl ? (
                            <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, avatarUrl: "" })} className="w-full sm:w-auto">
                              Remove
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </Field>
                  <Field label="Full name">
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </Field>
                  <Field label={roleCopy.orgLabel}>
                    <Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
                  </Field>
                  <Field label="Jurisdiction">
                    <Input value={form.jurisdiction} onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })} required />
                  </Field>
                  {isLawyer ? (
                    <Field label="Bar number">
                      <Input value={form.barNumber} onChange={(e) => setForm({ ...form, barNumber: e.target.value })} />
                    </Field>
                  ) : (
                    <Field label={roleCopy.personaLabel}>
                      <Select value={form.persona} onValueChange={(persona) => setForm({ ...form, persona })}>
                        <SelectTrigger><SelectValue placeholder="Choose context" /></SelectTrigger>
                        <SelectContent>
                          {userPersonas.map((persona) => <SelectItem key={persona} value={persona}>{persona}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                  <Field label={roleCopy.focusLabel}>
                    {isLawyer ? (
                      <Select value={form.practiceArea} onValueChange={(practiceArea) => setForm({ ...form, practiceArea })}>
                        <SelectTrigger><SelectValue placeholder="Choose area" /></SelectTrigger>
                        <SelectContent>
                          {lawyerAreas.map((area) => <SelectItem key={area} value={area}>{area}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value={form.practiceArea} onChange={(e) => setForm({ ...form, practiceArea: e.target.value })} placeholder="Contracts, property, employment..." />
                    )}
                  </Field>
                  <Field label="Response style">
                    <Select value={form.preferredTone} onValueChange={(preferredTone) => setForm({ ...form, preferredTone })}>
                      <SelectTrigger><SelectValue placeholder="Choose tone" /></SelectTrigger>
                      <SelectContent>
                        {tones.map((tone) => <SelectItem key={tone} value={tone}>{tone}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Primary use case" className="sm:col-span-2">
                    <Textarea
                      value={form.primaryUseCase}
                      onChange={(e) => setForm({ ...form, primaryUseCase: e.target.value })}
                      className="min-h-28"
                      placeholder={isLawyer ? "Review commercial contracts, prepare notices, summarize case files..." : "Understand contracts, prepare startup documents, compare agreements..."}
                    />
                  </Field>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <ProfileTile label="Email" value={profile.email} />
                  <ProfileTile label="Profile picture" value={profile.avatarUrl ? "Set" : "Not set"} />
                  <ProfileTile label="Account status" value={profile.status} />
                  <ProfileTile label={roleCopy.orgLabel} value={profile.organization} />
                  <ProfileTile label="Jurisdiction" value={profile.jurisdiction || "Pakistan"} />
                  {isLawyer ? (
                    <ProfileTile label="Bar number" value={profile.barNumber} />
                  ) : (
                    <ProfileTile label={roleCopy.personaLabel} value={profile.persona} />
                  )}
                  <ProfileTile label={roleCopy.focusLabel} value={profile.practiceArea} />
                  <ProfileTile label="Preferred response style" value={profile.preferredTone} />
                  <ProfileTile label="Primary use case" value={profile.primaryUseCase} className="sm:col-span-2" />
                </div>
              )}
            </form>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border bg-card p-6 shadow-soft">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-lex-500" />
                <h2 className="text-xl font-semibold">Subscription</h2>
              </div>
              <div className="rounded-xl border bg-background/50 p-4">
                <div className="text-sm text-muted-foreground">Current plan</div>
                <div className="mt-1 text-2xl font-semibold">{subscription.planName}</div>
                <div className="mt-2 text-sm text-muted-foreground">{subscription.status} · role-aware access enabled</div>
              </div>
              <Button asChild variant="outline" className="mt-4 w-full">
                <Link href="/billing">Manage subscription</Link>
              </Button>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-soft">
              <div className="mb-4 flex items-center gap-2">
                {isLawyer ? <Briefcase className="h-5 w-5 text-lex-500" /> : <Scale className="h-5 w-5 text-lex-500" />}
                <h2 className="text-xl font-semibold">How Lexora recognises you</h2>
              </div>
              <div className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>
                  {isLawyer
                    ? "Lawyer accounts see annotation workflows and counsel-oriented language. AI suggestions are framed as preparation support, with final judgment left to you."
                    : "User accounts see plain-language guidance, document explanations and drafting support designed for non-lawyer workflows."}
                </p>
                <p>Your saved jurisdiction, focus area and response style are passed into AI chat and drafting prompts.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PageTransition>
  );
}

function ProfileTile({ label, value, className }: { label: string; value?: string | null; className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-background/50 p-4", className)}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium leading-6">{value || "Not set"}</div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
