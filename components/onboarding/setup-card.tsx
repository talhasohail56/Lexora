"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Briefcase, Camera, Check, Loader2, Scale, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";
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
import { cn } from "@/lib/utils";

type Profile = {
  role: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  organization: string | null;
  jurisdiction: string | null;
  barNumber: string | null;
  persona: string | null;
  practiceArea: string | null;
  primaryUseCase: string | null;
  preferredTone: string | null;
};

const lawyerAreas = ["Corporate", "Litigation", "Property", "Family", "Tax", "Employment", "General practice"];
const userPersonas = ["Startup founder", "Business owner", "Student", "Freelancer", "Tenant / landlord", "Employee", "Other"];
const tones = ["Precise and formal", "Plain English", "Court-ready", "Business-friendly", "Detailed with citations"];

export function OnboardingSetup({ profile }: { profile: Profile }) {
  const router = useRouter();
  const isLawyer = profile.role === "LAWYER";
  const initials = profile.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "LX";
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    avatarUrl: profile.avatarUrl ?? "",
    organization: profile.organization ?? "",
    jurisdiction: profile.jurisdiction ?? "Pakistan",
    barNumber: profile.barNumber ?? "",
    persona: profile.persona ?? (isLawyer ? "Practicing lawyer" : "Startup founder"),
    practiceArea: profile.practiceArea ?? (isLawyer ? "Corporate" : ""),
    primaryUseCase: profile.primaryUseCase ?? "",
    preferredTone: profile.preferredTone ?? "Detailed with citations",
  });

  const copy = useMemo(() => {
    if (isLawyer) {
      return {
        icon: Briefcase,
        label: "Counsel workspace",
        title: "Your judgment stays at the center.",
        body:
          "Lexora prepares retrieval trails, draft scaffolds, citations, and review queues. You remain the lawyer, strategist, and final authority.",
        orgLabel: "Firm / chamber",
        focusLabel: "Primary practice area",
        useCasePlaceholder: "Example: review commercial contracts, draft notices, prepare case summaries",
      };
    }
    return {
      icon: UserRound,
      label: "Client workspace",
      title: "Lexora should feel built around your matter.",
      body:
        "Set your context once so answers, drafts, and reminders speak to your situation instead of feeling like a generic chatbot.",
      orgLabel: "Company / organization",
      focusLabel: "You are using Lexora as",
      useCasePlaceholder: "Example: understand contracts, prepare startup documents, compare agreements",
    };
  }, [isLawyer]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/profile/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save profile");
      toast.success("Workspace profile saved");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Could not save profile");
      setLoading(false);
    }
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
    reader.onload = () => setForm((current) => ({ ...current, avatarUrl: String(reader.result || "") }));
    reader.onerror = () => toast.error("Could not read that image");
    reader.readAsDataURL(file);
  }

  const Icon = copy.icon;
  const formAvatarIsUpload = form.avatarUrl.startsWith("data:image/");

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto overflow-x-hidden bg-black/80 p-3 backdrop-blur-xl sm:p-4">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:46px_46px]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_28%_26%,rgba(140,240,218,0.18),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(214,122,45,0.22),transparent_34%),radial-gradient(circle_at_50%_88%,rgba(245,162,80,0.16),transparent_30%)]" />

      <div className="relative mx-auto flex min-h-full w-full max-w-6xl items-center py-6 sm:py-10">
        <div className="grid w-full gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden min-h-[640px] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-white shadow-2xl lg:block"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-transparent to-orange-500/15" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white/80">
                <Scale className="h-4 w-4 text-[#8ff3d6]" />
                LEXORA SETUP
              </div>
              <div className="mt-24 text-sm uppercase tracking-[0.18em] text-white/40">
                {profile.name} / {copy.label} / Pakistan code
              </div>
              <h2 className="mt-4 max-w-[28rem] text-5xl font-bold leading-[0.96] tracking-tight xl:text-6xl">
                Make the workspace recognise you.
              </h2>
              <p className="mt-6 max-w-md text-lg leading-8 text-white/58">{copy.body}</p>
            </div>

            <motion.div
              animate={{ y: [0, -14, 0], rotate: [-4, -1, -4] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-[-4rem] top-40 z-0 w-72 rounded-2xl border border-white/10 bg-[#1b1714]/72 p-5 shadow-2xl"
            >
              <div className="text-sm text-white/38">legal memory</div>
              <div className="mt-8 text-3xl font-bold">{isLawyer ? "counsel-first" : "context-first"}</div>
            </motion.div>
            <motion.div
              animate={{ y: [0, 18, 0], rotate: [5, 2, 5] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-8 left-8 z-0 w-80 rounded-2xl border border-white/10 bg-[#201914]/80 p-5 shadow-2xl"
            >
              <div className="text-sm text-white/38">answer mode</div>
              <div className="mt-8 text-3xl font-bold">{form.preferredTone || "citations first"}</div>
            </motion.div>
            <div className="absolute bottom-44 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_38%_28%,#ffd49a,#d7782f_48%,#4b170c_84%)] shadow-[0_0_120px_rgba(214,122,45,0.38)]" />
          </motion.div>

          <motion.form
            onSubmit={submit}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-[1.5rem] border border-white/12 bg-[#14110d]/88 p-4 text-white shadow-2xl sm:rounded-[2rem] sm:p-6 md:p-8"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#8ff3d6]/70 to-transparent" />
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] text-[#8ff3d6]">
                  <Icon className="h-4 w-4" />
                  {copy.label}
                </div>
                <h1 className="mt-5 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{copy.title}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">{copy.body}</p>
              </div>
              <div className="flex max-w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/60 sm:max-w-xs">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.06] text-sm font-semibold text-white">
                  {form.avatarUrl ? (
                    <img src={form.avatarUrl} alt={`${profile.name} profile preview`} className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0 text-left sm:text-right">
                  <div className="truncate font-semibold text-white">{profile.name}</div>
                  <div className="truncate">{profile.email}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:mt-8 md:grid-cols-2">
              <Field label="Profile picture (optional)" className="md:col-span-2">
                <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] text-lg font-semibold text-white">
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
                      className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25"
                      placeholder="Paste image URL, or upload one below"
                    />
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.10]">
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
              <Field label={copy.orgLabel}>
                <Input
                  value={form.organization}
                  onChange={(e) => setForm({ ...form, organization: e.target.value })}
                  className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25"
                  placeholder={isLawyer ? "Raza & Co." : "Acme Pvt Ltd"}
                />
              </Field>
              <Field label="Jurisdiction">
                <Input
                  value={form.jurisdiction}
                  onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })}
                  className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25"
                  placeholder="Pakistan"
                />
              </Field>
              {isLawyer ? (
                <>
                  <Field label="Bar number">
                    <Input
                      value={form.barNumber}
                      onChange={(e) => setForm({ ...form, barNumber: e.target.value })}
                      className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25"
                      placeholder="Optional"
                    />
                  </Field>
                  <Field label={copy.focusLabel}>
                    <Select value={form.practiceArea} onValueChange={(practiceArea) => setForm({ ...form, practiceArea })}>
                      <SelectTrigger className="border-white/10 bg-white/[0.04] text-white">
                        <SelectValue placeholder="Choose area" />
                      </SelectTrigger>
                      <SelectContent>
                        {lawyerAreas.map((area) => (
                          <SelectItem key={area} value={area}>{area}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </>
              ) : (
                <>
                  <Field label={copy.focusLabel}>
                    <Select value={form.persona} onValueChange={(persona) => setForm({ ...form, persona })}>
                      <SelectTrigger className="border-white/10 bg-white/[0.04] text-white">
                        <SelectValue placeholder="Choose context" />
                      </SelectTrigger>
                      <SelectContent>
                        {userPersonas.map((item) => (
                          <SelectItem key={item} value={item}>{item}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Legal focus">
                    <Input
                      value={form.practiceArea}
                      onChange={(e) => setForm({ ...form, practiceArea: e.target.value })}
                      className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25"
                      placeholder="Contracts, property, employment..."
                    />
                  </Field>
                </>
              )}
              <Field label="Response style">
                <Select value={form.preferredTone} onValueChange={(preferredTone) => setForm({ ...form, preferredTone })}>
                  <SelectTrigger className="border-white/10 bg-white/[0.04] text-white">
                    <SelectValue placeholder="Choose tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {tones.map((tone) => (
                      <SelectItem key={tone} value={tone}>{tone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Main reason you are here" className="md:col-span-2">
                <Textarea
                  required
                  value={form.primaryUseCase}
                  onChange={(e) => setForm({ ...form, primaryUseCase: e.target.value })}
                  className="min-h-28 border-white/10 bg-white/[0.04] text-white placeholder:text-white/25"
                  placeholder={copy.useCasePlaceholder}
                />
              </Field>
            </div>

            <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#8ff3d6]/12 text-[#8ff3d6]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">{isLawyer ? "Designed to protect professional identity" : "Designed to feel personal"}</div>
                  <p className="mt-1 text-sm leading-6 text-white/50">
                    {isLawyer
                      ? "The product language will keep positioning AI as preparation, retrieval, and drafting support - not a replacement for counsel."
                      : "The dashboard, drafting prompts, and AI guidance will now use your saved context when framing next steps."}
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-6 h-12 w-full rounded-xl bg-white text-base font-semibold text-black hover:bg-white/90"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save workspace setup
            </Button>
          </motion.form>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm text-white/66">{label}</Label>
      {children}
    </div>
  );
}
