import Link from "next/link";
import { Scale } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-svh overflow-x-hidden bg-[#080806] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,#130806_0%,#080806_40%,#151107_70%,#2c0b08_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,#080806_0%,transparent_38%,rgba(255,255,255,0.05)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),transparent)]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:46px_46px]" />
      <div className="absolute -left-28 top-16 h-80 w-80 rounded-full bg-teal-300/[0.10] blur-3xl" />
      <div className="absolute -right-28 bottom-0 h-96 w-96 rounded-full bg-orange-500/[0.12] blur-3xl" />

      <header className="pointer-events-none fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-5 py-5 md:px-7">
        <Link
          href="/"
          className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/[0.22] px-3 py-2 text-xs font-semibold backdrop-blur-md"
        >
          <Scale className="h-4 w-4" />
          LEXORA
        </Link>
        <Link
          href="/pricing"
          className="pointer-events-auto rounded-full border border-white/[0.08] bg-black/[0.18] px-3 py-2 text-xs text-white/[0.62] backdrop-blur-md transition-colors hover:text-white"
        >
          Pricing
        </Link>
      </header>

      <main className="relative z-10 flex min-h-svh items-center justify-center px-4 py-24 sm:px-5 md:px-10">
        {children}
      </main>
    </div>
  );
}
