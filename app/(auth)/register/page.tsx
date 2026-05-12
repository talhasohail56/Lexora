"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Briefcase, CreditCard, FileSearch, Loader2, Lock, Mail, Scale, User } from "lucide-react";

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
  const inputClass = "border-white/[0.12] bg-black/[0.22] pl-9 text-white placeholder:text-white/[0.28] focus-visible:ring-teal-200/40";
  const labelClass = "text-white/[0.72]";

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
      initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
      className="grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_1fr]"
    >
      <section className="relative hidden min-h-[690px] overflow-hidden lg:block">
        <div className="absolute inset-x-0 top-20 h-px bg-gradient-to-r from-transparent via-white/[0.18] to-transparent" />
        <div className="absolute bottom-20 left-0 h-px w-[86%] bg-gradient-to-r from-white/[0.20] to-transparent" />
        <div className="absolute left-20 top-32 h-80 w-80 rounded-full border border-white/[0.10]" />
        <div className="absolute left-32 top-44 h-52 w-52 rounded-full border border-white/[0.08]" />

        <motion.div
          animate={{ y: [0, -10, 0], rotate: [-4, -2, -4] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          className="absolute left-2 top-2 z-10 w-64 rounded-xl border border-white/[0.10] bg-white/[0.055] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-md"
        >
          <p className="text-xs text-white/[0.38]">selected plan</p>
          <div className="mt-7 flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-teal-200" />
            <p className="text-2xl font-semibold">{selectedPlan.name}</p>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 12, 0], rotate: [5, 3, 5] }}
          transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
          className="absolute right-4 top-24 z-10 w-72 rounded-xl border border-white/[0.10] bg-white/[0.055] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-md"
        >
          <p className="text-xs text-white/[0.38]">workspace mode</p>
          <div className="mt-7 flex items-center gap-3">
            {form.role === "LAWYER" ? <Briefcase className="h-5 w-5 text-amber-200" /> : <Scale className="h-5 w-5 text-amber-200" />}
            <p className="text-2xl font-semibold">{ROLE_COPY[form.role].label}</p>
          </div>
        </motion.div>

        <motion.div
          animate={{ scale: [1, 1.04, 1], rotate: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 9, ease: "easeInOut" }}
          className="absolute right-28 top-60 z-0 h-52 w-52 rounded-full bg-[radial-gradient(circle_at_34%_24%,#ffd29a_0%,#d87936_42%,#5b1e10_76%,#1b0704_100%)] opacity-80 shadow-[0_30px_120px_rgba(249,115,22,0.28)]"
        >
          <div className="absolute inset-10 rounded-full border border-black/[0.28] bg-black/[0.10]" />
          <div className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,rgba(255,255,255,0.32),transparent_48%,rgba(0,0,0,0.32))]" />
        </motion.div>

        <div className="absolute bottom-0 left-0 z-20 max-w-[540px]">
          <p className="mb-5 text-xs tracking-[0.14em] text-white/[0.48]">LEGAL WORKSPACE / ROLE-AWARE ACCESS / PAKISTAN CODE</p>
          <h1 className="max-w-[540px] text-6xl font-semibold leading-[0.94] xl:text-7xl">Choose your legal workspace.</h1>
          <p className="mt-6 max-w-md text-sm leading-6 text-white/[0.52]">
            Start as a client/user or a lawyer. Lexora adapts the interface, limits, annotations and AI framing around that role.
          </p>
          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 border-t border-white/[0.10] pt-5">
            {[
              ["Role", form.role === "LAWYER" ? "lawyer-led" : "client-focused"],
              ["RAG", "citations first"],
              ["Setup", "personalized"],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-[11px] text-white/[0.34]">{label}</p>
                <p className="mt-1 text-sm font-medium text-white/[0.78]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-xl">
        <div className="rounded-2xl border border-white/[0.10] bg-white/[0.055] p-5 shadow-[0_30px_110px_rgba(0,0,0,0.34)] backdrop-blur-xl md:p-7">
          <div className="mb-6">
            <p className="mb-3 text-xs tracking-[0.14em] text-teal-200/[0.72]">LEXORA ONBOARDING</p>
            <h2 className="text-3xl font-semibold leading-tight md:text-4xl">Create your workspace</h2>
            <p className="mt-3 text-sm leading-6 text-white/[0.50]">
              Pick the role and plan first, then we will tune the dashboard after sign in.
            </p>
          </div>

          <Button asChild variant="outline" className="mb-5 h-11 w-full border-white/[0.13] bg-black/[0.22] text-white hover:bg-white/[0.08] hover:text-white">
            <a href={googleHref}>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[#080806]">G</span>
              Continue with Google
            </a>
          </Button>
          <div className="mb-5 flex items-center gap-3 text-xs text-white/[0.38]">
            <span className="h-px flex-1 bg-white/[0.12]" />
            or create with email
            <span className="h-px flex-1 bg-white/[0.12]" />
          </div>

          <form onSubmit={submit} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label className={labelClass}>Full name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-white/[0.36]" />
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Jane Doe" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-white/[0.36]" />
              <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="you@example.com" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-white/[0.36]" />
              <Input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} placeholder="At least 6 characters" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className={labelClass}>Workspace type</Label>
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
                        ? "border-teal-200/45 bg-teal-200/[0.10] text-white shadow-[0_0_38px_rgba(94,234,212,0.10)]"
                        : "border-white/[0.10] bg-black/[0.22] text-white/[0.54] hover:border-white/[0.22] hover:text-white"
                    }`}
                  >
                    <Icon className={form.role === r ? "h-4 w-4 text-teal-200" : "h-4 w-4"} />
                    <div className="text-left">
                      <div className="font-medium">{ROLE_COPY[r].label}</div>
                      <div className="text-xs opacity-70">{ROLE_COPY[r].sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs leading-5 text-white/[0.46]">{ROLE_COPY[form.role].helper}</p>
          </div>

          <div className="space-y-2">
            <Label className={labelClass}>Plan</Label>
            <div className="grid gap-2">
              {availablePlans.map((plan) => (
                <button
                  key={plan.code}
                  type="button"
                  onClick={() => setForm({ ...form, planCode: plan.code })}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    form.planCode === plan.code
                      ? "border-orange-200/45 bg-orange-200/[0.10] text-white shadow-[0_0_42px_rgba(251,146,60,0.12)]"
                      : "border-white/[0.10] bg-black/[0.22] text-white/[0.62] hover:border-white/[0.22] hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{plan.name}</div>
                    <div className={form.planCode === plan.code ? "text-sm text-orange-100" : "text-sm text-white/[0.42]"}>{plan.price}</div>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-white/[0.46]">{plan.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.10] bg-black/[0.22] p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileSearch className="h-4 w-4 text-teal-200" />
              Selected plan
            </div>
            <p className="mt-1 text-sm text-white/[0.50]">
              {selectedPlan.name}. You can change this from Billing after signup.
            </p>
          </div>
          <Button type="submit" className="h-11 w-full bg-white text-[#080806] hover:bg-white/90" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create account <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-white/[0.48]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-white underline-offset-4 hover:underline">Sign in</Link>
        </p>
        </div>
      </section>
    </motion.div>
  );
}
