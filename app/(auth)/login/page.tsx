"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Database, FileSearch, Loader2, Lock, Mail, Scale, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("error");
    if (!error) return;
    toast.error(error === "google_not_configured" ? "Google login needs the OAuth client ID." : "Google sign-in failed.");
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Login failed");
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
      className="grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]"
    >
      <section className="relative hidden min-h-[560px] lg:block">
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [-4, -2, -4] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          className="absolute left-0 top-10 w-72 rounded-lg border border-white/[0.10] bg-white/[0.055] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-md"
        >
          <p className="text-xs text-white/[0.38]">vector memory</p>
          <div className="mt-8 flex items-center gap-3">
            <Database className="h-5 w-5 text-teal-200" />
            <p className="text-3xl font-semibold">4,011 chunks</p>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 12, 0], rotate: [5, 3, 5] }}
          transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
          className="absolute right-2 top-28 w-72 rounded-lg border border-white/[0.10] bg-white/[0.055] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-md"
        >
          <p className="text-xs text-white/[0.38]">jurisdiction</p>
          <div className="mt-8 flex items-center gap-3">
            <Scale className="h-5 w-5 text-amber-200" />
            <p className="text-3xl font-semibold">Pakistan Code</p>
          </div>
        </motion.div>

        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.12]" />
        <motion.div
          animate={{ scale: [1, 1.04, 1], rotate: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 9, ease: "easeInOut" }}
          className="absolute left-1/2 top-[52%] h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_34%_24%,#ffd29a_0%,#d87936_42%,#5b1e10_76%,#1b0704_100%)] shadow-[0_30px_120px_rgba(249,115,22,0.28)]"
        >
          <div className="absolute inset-10 rounded-full border border-black/[0.28] bg-black/[0.10]" />
          <div className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,rgba(255,255,255,0.32),transparent_48%,rgba(0,0,0,0.32))]" />
        </motion.div>

        <motion.div
          animate={{ y: [0, -12, 0], rotate: [3, 5, 3] }}
          transition={{ repeat: Infinity, duration: 6.4, ease: "easeInOut" }}
          className="absolute bottom-10 left-14 w-72 rounded-lg border border-white/[0.10] bg-black/[0.22] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-md"
        >
          <p className="text-xs text-white/[0.38]">risk radar</p>
          <div className="mt-8 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-teal-200" />
            <p className="text-3xl font-semibold">citations first</p>
          </div>
        </motion.div>

        <div className="absolute bottom-0 left-0 max-w-xl">
          <p className="mb-5 text-xs text-white/[0.48]">LEGAL WORKSPACE / RAG SYSTEM / SECURE ACCESS</p>
          <h1 className="text-7xl font-semibold leading-none">Enter the legal machine.</h1>
          <p className="mt-6 max-w-md text-sm leading-6 text-white/[0.52]">
            Sign in to retrieve legal context, analyze contracts, draft documents and keep every answer attached to evidence.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-md">
        <div className="rounded-lg border border-white/[0.10] bg-white/[0.055] p-6 shadow-[0_30px_110px_rgba(0,0,0,0.34)] backdrop-blur-xl md:p-8">
          <div className="mb-7">
            <p className="mb-3 text-xs text-teal-200/[0.72]">LEXORA ACCESS</p>
            <h2 className="text-4xl font-semibold leading-none">Welcome back</h2>
            <p className="mt-3 text-sm leading-6 text-white/[0.48]">Continue into your AI paralegal workspace.</p>
          </div>

          <Button asChild variant="outline" className="mb-5 h-11 w-full border-white/[0.13] bg-black/[0.22] text-white hover:bg-white/[0.08] hover:text-white">
            <a href="/api/auth/google">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[#080806]">G</span>
              Continue with Google
            </a>
          </Button>
          <div className="mb-5 flex items-center gap-3 text-xs text-white/[0.38]">
            <span className="h-px flex-1 bg-white/[0.12]" />
            or use email
            <span className="h-px flex-1 bg-white/[0.12]" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/[0.72]">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-white/[0.36]" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-white/[0.12] bg-black/[0.22] pl-9 text-white placeholder:text-white/[0.28] focus-visible:ring-teal-200/40"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-white/[0.72]">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-white/[0.36]" />
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-white/[0.12] bg-black/[0.22] pl-9 text-white placeholder:text-white/[0.28] focus-visible:ring-teal-200/40"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <Button type="submit" className="h-11 w-full bg-white text-[#080806] hover:bg-white/90" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white/[0.48]">
            New here?{" "}
            <Link href="/register" className="font-medium text-white underline-offset-4 hover:underline">Create an account</Link>
          </p>

          <div className="mt-6 rounded-lg border border-white/[0.10] bg-black/[0.22] p-4 text-xs text-white/[0.46]">
            <div className="mb-3 flex items-center gap-2 text-white/[0.72]">
              <FileSearch className="h-4 w-4 text-teal-200" />
              Demo access
            </div>
            <span className="font-medium text-white">admin@lexora.ai</span> · password123
          </div>
        </div>
      </section>
    </motion.div>
  );
}
