"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlowCard } from "@/components/animated/glow-card";
import { toast } from "sonner";
import { Loader2, User, Mail, Lock, Scale, Briefcase, CreditCard } from "lucide-react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER" as "USER" | "LAWYER",
    planCode: "STARTER",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const googleHref = `/api/auth/google?role=${form.role}&plan=${encodeURIComponent(form.planCode)}`;

  useEffect(() => {
    const plan = new URLSearchParams(window.location.search).get("plan")?.toUpperCase();
    if (!plan) return;
    setForm((f) => ({
      ...f,
      planCode: plan,
      role: plan.includes("LAWYER") ? "LAWYER" : f.role,
    }));
  }, []);

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
      router.push(`/verify-otp?email=${encodeURIComponent(form.email)}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
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
        <h1 className="text-2xl font-bold mb-1.5">Create your account</h1>
        <p className="text-sm text-muted-foreground mb-6">Get started with Lexora in 30 seconds</p>
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
          <div className="space-y-1.5">
            <Label>Account type</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["USER", "LAWYER"] as const).map((r) => {
                const Icon = r === "USER" ? Scale : Briefcase;
                return (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setForm({ ...form, role: r })}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors ${
                      form.role === r
                        ? "border-lex-500 bg-lex-500/10 text-foreground"
                        : "border-border bg-background hover:border-lex-500/50 text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">{r === "USER" ? "Individual" : "Lawyer"}</div>
                      <div className="text-xs opacity-70">{r === "USER" ? "Basic features" : "Compliance + annotations"}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/40 p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CreditCard className="h-4 w-4 text-primary" />
              Selected plan
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {form.planCode.replace("_", " ")}. You can change this from Billing after signup.
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
