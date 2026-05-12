"use client";

import { Suspense, useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlowCard } from "@/components/animated/glow-card";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";

function VerifyOtpInner() {
  const params = useSearchParams();
  const router = useRouter();
  const email = params.get("email") || "";
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);

  function setAt(i: number, v: string) {
    const x = v.replace(/\D/g, "").slice(-1);
    setDigits((d) => { const next = [...d]; next[i] = x; return next; });
    if (x && i < 5) refs.current[i + 1]?.focus();
  }
  function onKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const otp = digits.join("");
      if (otp.length !== 6) throw new Error("Enter all 6 digits");
      const r = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Verification failed");
      toast.success("Email verified. Please sign in.");
      router.push("/login");
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  }

  async function resend() {
    if (!email) return toast.error("Missing email address");
    setResending(true);
    try {
      const r = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Could not resend OTP");
      if (data.emailSent) {
        toast.success("New OTP sent. Check inbox or spam.");
      } else {
        toast.error(`OTP email failed: ${data.emailError || "unknown Resend error"}`);
      }
      if (data.devOtp) toast.message(`Local fallback OTP: ${data.devOtp}`);
      setDigits(Array(6).fill(""));
      refs.current[0]?.focus();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setResending(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
      <GlowCard className="p-8">
        <div className="flex justify-center mb-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-lex-500 to-amber-500 flex items-center justify-center text-white">
            <Mail className="h-6 w-6" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center mb-1.5">Verify your email</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Enter the 6-digit code sent to <span className="text-foreground font-medium">{email}</span>
        </p>
        <p className="mb-5 rounded-lg border border-border bg-muted/40 p-3 text-center text-xs text-muted-foreground">
          The email comes from <span className="font-medium text-foreground">onboarding@resend.dev</span>. Check spam/promotions if it is not in inbox.
        </p>
        <form onSubmit={submit} className="space-y-6">
          <div className="flex justify-center gap-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                value={d}
                onChange={(e) => setAt(i, e.target.value)}
                onKeyDown={(e) => onKey(i, e)}
                className="h-14 w-12 text-center text-lg font-bold rounded-lg border border-input bg-background/50 focus-visible:ring-2 focus-visible:ring-ring outline-none"
                inputMode="numeric"
                maxLength={1}
              />
            ))}
          </div>
          <Button type="submit" variant="gradient" className="w-full h-11" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
          </Button>
        </form>
        <Button
          type="button"
          variant="ghost"
          className="mt-4 w-full"
          onClick={resend}
          disabled={resending}
        >
          {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resend code"}
        </Button>
      </GlowCard>
    </motion.div>
  );
}

export const dynamic = "force-dynamic";

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <VerifyOtpInner />
    </Suspense>
  );
}
