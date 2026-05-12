"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlowCard } from "@/components/animated/glow-card";
import { toast } from "sonner";
import { Loader2, User, Mail, Lock, Scale, Briefcase, CreditCard } from "lucide-react";

const PLAN_CHOICES = {
  USER: [
    {
      code: "STARTER",
      name: "User Starter",
      price: "Free",
      desc: "For individuals who want document answers, uploads, chat, and basic drafting.",
    },
    {
      code: "PRO",
      name: "User Professional",
      price: "$19/mo",
      desc: "For clients, founders, and students who also need compare, compliance, timelines, and advanced drafting.",
    },
  ],
  LAWYER: [
    {
      code: "LAWYER_TRIAL",
      name: "Lawyer Trial",
      price: "14 days free",
      desc: "For counsel who want annotations, review trails, citations, and lawyer-grade workflows.",
    },
    {
      code: "LAWYER",
      name: "Lawyer Pro",
      price: "$49/mo",
      desc: "For practicing lawyers who need high-volume analysis without giving up professional judgment.",
    },
  ],
} as const;

const ROLE_COPY = {
  USER: {
    label: "User / Client",
    sub: "Understand, draft, compare",
    helper: "For students, founders, business owners, employees, and anyone handling their own legal documents.",
  },
  LAWYER: {
    label: "Lawyer",
    sub: "Review, annotate, advise",
    helper: "For advocates and legal teams. Lexora supports preparation and retrieval; you remain counsel.",
  },
} as const;

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER" as "USER" | "LAWYER",
    planCode: "STARTER",
  });
  const [loading, setLoading] = useState(false);
  const googleHref = `/api/auth/google?role=${form.role}&plan=${encodeURIComponent(form.planCode)}`;
  const availablePlans = PLAN_CHOICES[form.role];
  const selectedPlan = availablePlans.find((plan) => plan.code === form.planCode) ?? availablePlans[0];

  useEffect(() => {
    const plan = new URLSearchParams(window.location.search).get("plan")?.toUpperCase();
    if (!plan) return;
    setForm((f) => ({
      ...f,
      planCode: plan,
      role: plan.includes("LAWYER") ? "LAWYER" : f.role,
    }));
  }, []);

  function changeRole(role: "USER" | "LAWYER") {
    setForm((f) => {
      const isLawyerPlan = f.planCode.includes("LAWYER");
      return {
        ...f,
        role,
        planCode: role === "LAWYER"
          ? isLawyerPlan ? f.planCode : "LAWYER_TRIAL"
          : isLawyerPlan ? "STARTER" : f.planCode,
      };
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Registration failed");
      if (data.emailSent) {
        toast.success("Account created. Check your inbox or spam for the OTP.");
      } else {
        toast.error(`Account created, but email failed: ${data.emailError || "unknown Resend error"}`);
      }
      if (data.devOtp) toast.message(`Local fallback OTP: ${data.devOtp}`);
      window.location.assign(`/verify-otp?email=${encodeURIComponent(form.email)}`);
    } catch (e: any) {
      toast.error(e.message);
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <GlowCard className="p-8">
        <h1 className="text-2xl font-bold mb-1.5">Create your Lexora workspace</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Choose how Lexora should treat your legal work from day one.
        </p>
        <Button asChild variant="outline" className="mb-5 h-11 w-full bg-background/60">
          <a href={googleHref}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">G</span>
            Continue with Google
          </a>
        </Button>
        <div className="mb-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or create with email
          <span className="h-px flex-1 bg-border" />
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="pl-9" placeholder="Jane Doe" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="pl-9" placeholder="you@example.com" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="pl-9" placeholder="At least 6 characters" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Workspace type</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["USER", "LAWYER"] as const).map((r) => {
                const Icon = r === "USER" ? Scale : Briefcase;
                return (
                  <button
                    type="button"
                    key={r}
                    onClick={() => changeRole(r)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors ${
                      form.role === r
                        ? "border-lex-500 bg-lex-500/10 text-foreground"
                        : "border-border bg-background hover:border-lex-500/50 text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">{ROLE_COPY[r].label}</div>
                      <div className="text-xs opacity-70">{ROLE_COPY[r].sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs leading-5 text-muted-foreground">{ROLE_COPY[form.role].helper}</p>
          </div>

          <div className="space-y-2">
            <Label>Plan</Label>
            <div className="grid gap-2">
              {availablePlans.map((plan) => (
                <button
                  key={plan.code}
                  type="button"
                  onClick={() => setForm({ ...form, planCode: plan.code })}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    form.planCode === plan.code
                      ? "border-lex-500 bg-lex-500/10 shadow-glow"
                      : "border-border bg-background/50 hover:border-lex-500/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{plan.name}</div>
                    <div className="text-sm text-muted-foreground">{plan.price}</div>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{plan.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-muted/40 p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CreditCard className="h-4 w-4 text-primary" />
              Selected plan
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedPlan.name}. You can change this from Billing after signup.
            </p>
          </div>
          <Button type="submit" variant="gradient" className="w-full h-11" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground font-medium underline-offset-4 hover:underline">Sign in</Link>
        </p>
      </GlowCard>
    </motion.div>
  );
}
