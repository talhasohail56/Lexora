"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, type MotionValue, useScroll, useSpring } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Database,
  FileSearch,
  FileText,
  Gavel,
  Landmark,
  MessageSquare,
  Network,
  Scale,
  SearchCheck,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const rail = ["AI", "Docs", "RAG", "Law", "Risk", "Open"];

const pipelineSteps = [
  { step: "01", label: "Ingest", icon: FileText },
  { step: "02", label: "Chunk", icon: Workflow },
  { step: "03", label: "Embed", icon: Network },
  { step: "04", label: "Retrieve", icon: SearchCheck },
  { step: "05", label: "Cite", icon: BookOpen },
];

const evidenceCards = [
  { tag: "Act", title: "Contract Act, 1872", meta: "obligations / consent / breach" },
  { tag: "Rule", title: "SECP compliance", meta: "filings / governance / notices" },
  { tag: "Case", title: "Civil procedure signal", meta: "forum / relief / limitation" },
  { tag: "Clause", title: "Indemnity exception", meta: "risk / cap / carve-outs" },
  { tag: "Source", title: "Pakistan Code", meta: "federal statute / verified source" },
  { tag: "Doc", title: "Uploaded agreement", meta: "party terms / red flags" },
];

export default function Landing() {
  const scrollerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ container: scrollerRef });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });

  return (
    <main
      ref={scrollerRef}
      className="h-svh snap-y snap-mandatory overflow-y-auto scroll-smooth overscroll-y-contain bg-[#080806] text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <FixedNav />
      <ScrollRail progress={progress} />

      <Scene id="hero" className="bg-[#080806]">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,#130806_0%,#080806_38%,#151107_68%,#2c0b08_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,#080806_0%,transparent_36%,rgba(255,255,255,0.05)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),transparent)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:46px_46px]" />
        <HeroSignalCards />

        <div className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-5 pb-12 pt-20 text-center">
          <motion.p
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="mb-5 text-xs text-white/[0.55]"
          >
            LEGAL WORKSPACE / RAG SYSTEM / PAKISTAN CODE
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 22, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 max-w-6xl text-5xl font-semibold leading-none sm:text-6xl md:text-8xl lg:text-9xl"
          >
            Powered by AI
            <sup className="ml-2 align-super text-sm font-medium text-white/[0.48] md:text-base">LEXORA</sup>
          </motion.h1>

          <GlassObject />

          <div className="relative z-10 mt-9 grid w-full max-w-5xl gap-4 text-left md:grid-cols-[1fr_1.2fr_1fr]">
            <MiniSpec label="Corpus" value="1,000 legal sources" />
            <MiniSpec label="What changed" value="No synthetic filler. Actual legal sources only." center />
            <MiniSpec label="Retrieval" value="4,011 chunks indexed before generation" />
          </div>
        </div>
      </Scene>

      <Scene id="memory" className="bg-[#d8c59f] text-[#140d08]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#8a4022_0%,#d7b981_20%,#f1e4c8_55%,#a85b2d_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.55),transparent_32%,rgba(0,0,0,0.18)_100%)]" />
        <div className="relative z-10 flex min-h-[100svh] items-center px-5 py-24 md:px-10">
          <div className="grid w-full items-center gap-10 md:grid-cols-[0.95fr_1.05fr]">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.5 }}
              transition={{ duration: 0.55 }}
            >
              <p className="mb-5 text-xs text-[#140d08]/[0.58]">WHAT THE MODEL READS FIRST</p>
              <h2 className="max-w-3xl text-5xl font-semibold leading-none sm:text-6xl md:text-8xl">
                Documents that answer back.
              </h2>
              <p className="mt-6 max-w-md text-sm leading-6 text-[#140d08]/[0.64] md:text-base">
                Upload contracts. Search Pakistan legal sources. Ask questions that come back with context,
                clauses and citations instead of vague confidence.
              </p>
            </motion.div>
            <DocumentDesk />
          </div>
        </div>
      </Scene>

      <Scene id="retrieval" className="bg-[#0b0d09]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#06110e_0%,#100806_46%,#250905_100%)]" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:52px_52px]" />
        <div className="absolute inset-x-0 top-1/2 h-px bg-[linear-gradient(90deg,transparent,rgba(45,212,191,0.55),rgba(251,146,60,0.52),transparent)]" />
        <div className="relative z-10 flex min-h-[100svh] flex-col justify-center px-5 py-24 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 28, filter: "blur(9px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: false, amount: 0.45 }}
            transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-6xl text-center"
          >
            <p className="mb-4 text-xs text-teal-200/[0.72]">RETRIEVAL LAYER</p>
            <h2 className="text-4xl font-semibold leading-none sm:text-5xl md:text-8xl">
              Context moves before the answer.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-6 text-white/[0.52]">
              Every response starts by ranking legal sources, contract clauses and compliance rules before
              the model writes a single sentence.
            </p>
          </motion.div>

          <HorizontalEvidenceFlow />

          <div className="mx-auto mt-10 grid w-full max-w-5xl overflow-hidden rounded-lg border border-white/[0.1] bg-white/[0.035] md:grid-cols-5">
            {pipelineSteps.map(({ step, label, icon: Icon }) => (
              <div key={label} className="border-b border-white/[0.08] p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
                <div className="mb-8 flex items-center justify-between">
                  <span className="text-xs text-white/[0.34]">{step}</span>
                  <Icon className="h-4 w-4 text-teal-200" />
                </div>
                <p className="text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </Scene>

      <Scene id="jurisdiction" className="bg-[#140806]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#1b0705,#2a0905_45%,#070908_100%)]" />
        <div className="absolute left-0 top-0 h-full w-1/3 bg-[linear-gradient(90deg,rgba(249,115,22,0.20),transparent)]" />
        <div className="relative z-10 flex min-h-[100svh] items-center px-5 py-24 md:px-10">
          <div className="grid w-full items-center gap-10 md:grid-cols-[1fr_0.95fr]">
            <div>
              <p className="mb-3 text-xs text-white/[0.44]">VERDICT CONTEXT</p>
              <motion.h2
                initial={{ opacity: 0, y: 28, filter: "blur(9px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: false, amount: 0.55 }}
                transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-5xl text-4xl font-semibold leading-none sm:text-6xl md:text-8xl lg:text-9xl"
              >
                jurisdiction with receipts.
              </motion.h2>
              <div className="mt-7 grid max-w-4xl gap-5 md:grid-cols-[1fr_1fr]">
                <p className="text-sm leading-6 text-white/[0.58]">
                  Lexora is not trained on twelve sample notes. It retrieves actual legal material before it
                  explains a clause or compliance issue.
                </p>
                <p className="text-sm leading-6 text-white/[0.38]">
                  Pakistan Code sources, document chunks, compliance rules and uploaded contracts are all
                  treated as first-class context.
                </p>
              </div>
            </div>
            <JurisdictionSignal />
          </div>
        </div>
      </Scene>

      <Scene id="analysis" className="bg-[#eb2b14]">
        <div className="absolute inset-0 bg-[linear-gradient(100deg,#d91f12_0%,#ee4a18_46%,#f6b26b_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.18),transparent_50%,rgba(255,255,255,0.16))]" />
        <div className="relative z-10 flex min-h-[100svh] items-center px-5 py-24 md:px-10">
          <div className="grid w-full items-center gap-10 md:grid-cols-[1fr_0.95fr]">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.5 }}
              transition={{ duration: 0.55 }}
            >
              <p className="mb-3 text-xs text-white/[0.72]">CONTRACT INTELLIGENCE</p>
              <h2 className="max-w-5xl text-5xl font-semibold leading-none sm:text-6xl md:text-8xl lg:text-9xl">
                Risk is no longer hidden in paragraph seven.
              </h2>
            </motion.div>
            <RiskDevice />
          </div>
        </div>
        <RiskTicker />
      </Scene>

      <Scene id="access" className="bg-[#070907]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#070907,#0e1915_48%,#241107_100%)]" />
        <div className="relative z-10 flex min-h-[100svh] items-center px-5 py-24 md:px-10">
          <div className="mx-auto max-w-6xl text-center">
            <p className="mb-4 text-xs text-teal-300">THE PART THAT ACTUALLY MADE IT WORK</p>
            <h2 className="text-4xl font-semibold leading-none sm:text-5xl md:text-8xl">
              It looks expensive because the context is real.
            </h2>
            <AccessCardFan />
            <div className="mx-auto mt-10 grid max-w-4xl gap-3 text-left md:grid-cols-3">
              <Proof icon={Database} title="1,000 sources" text="Actual legal material, not derived filler." />
              <Proof icon={MessageSquare} title="RAG chat" text="Answers use retrieved chunks and citations." />
              <Proof icon={ShieldCheck} title="Compliance" text="Rule checks, LLM review and audit trail." />
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="w-full bg-white text-[#090c09] hover:bg-white/90 min-[420px]:w-auto">
                <Link href="/register">
                  Open the demo <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full border-white/[0.16] bg-white/5 text-white hover:bg-white/10 hover:text-white min-[420px]:w-auto"
              >
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </Scene>
    </main>
  );
}

function FixedNav() {
  return (
    <header className="pointer-events-none fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-5 py-5 text-white md:px-7">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/[0.22] px-3 py-2 text-xs font-semibold backdrop-blur-md">
        <Scale className="h-4 w-4" />
        LEXORA
      </div>
      <div className="pointer-events-auto flex items-center gap-2">
        <Link
          href="/pricing"
          className="hidden rounded-full border border-white/[0.08] bg-black/[0.18] px-3 py-2 text-xs text-white/[0.62] backdrop-blur-md transition-colors hover:text-white sm:inline"
        >
          Pricing
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-white/[0.08] bg-black/[0.18] px-3 py-2 text-xs text-white/[0.62] backdrop-blur-md transition-colors hover:text-white"
        >
          Enter
        </Link>
      </div>
    </header>
  );
}

function ScrollRail({ progress }: { progress: MotionValue<number> }) {
  return (
    <div className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex">
      <div className="relative h-44 w-px overflow-hidden bg-white/15">
        <motion.div
          className="absolute inset-x-0 top-0 w-px origin-top bg-white"
          style={{ scaleY: progress }}
        />
      </div>
      {rail.map((item, index) => (
        <span key={item} className="relative flex h-7 w-7 items-center justify-center text-[10px] text-white/[0.42]">
          <motion.span
            className="absolute inset-0 rounded-full border border-white/[0.08]"
            animate={{ scale: [1, 1.16, 1], opacity: [0.25, 0.72, 0.25] }}
            transition={{ repeat: Infinity, duration: 2.8, delay: index * 0.18, ease: "easeInOut" }}
          />
          {item}
        </span>
      ))}
    </div>
  );
}

function Scene({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={`relative min-h-[100svh] snap-start overflow-hidden [scroll-snap-stop:always] ${className ?? ""}`}
    >
      {children}
    </section>
  );
}

function HeroSignalCards() {
  const cards = [
    { label: "vector search", value: "4,011 chunks", className: "left-[7%] top-[23%]" },
    { label: "legal memory", value: "Pakistan Code", className: "right-[8%] top-[24%]" },
    { label: "risk radar", value: "clause-level", className: "left-[12%] bottom-[18%]" },
    { label: "answer mode", value: "citations first", className: "right-[13%] bottom-[16%]" },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 z-[1] hidden md:block">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 34, rotate: index % 2 ? 4 : -4 }}
          animate={{
            opacity: 1,
            y: [0, -12, 0],
            rotate: index % 2 ? [3, 5, 3] : [-3, -5, -3],
          }}
          transition={{
            opacity: { delay: 0.45 + index * 0.08, duration: 0.55 },
            y: { repeat: Infinity, duration: 5 + index * 0.45, ease: "easeInOut" },
            rotate: { repeat: Infinity, duration: 6 + index * 0.4, ease: "easeInOut" },
          }}
          className={`absolute w-52 rounded-lg border border-white/[0.1] bg-white/[0.06] p-4 text-left shadow-[0_28px_90px_rgba(0,0,0,0.3)] backdrop-blur-md ${card.className}`}
        >
          <p className="text-xs text-white/[0.38]">{card.label}</p>
          <p className="mt-6 text-xl font-semibold">{card.value}</p>
        </motion.div>
      ))}
    </div>
  );
}

function HorizontalEvidenceFlow() {
  const cards = [...evidenceCards, ...evidenceCards];

  return (
    <div className="relative mt-12 overflow-hidden py-7">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28 bg-[linear-gradient(90deg,#0b0d09,transparent)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-28 bg-[linear-gradient(270deg,#120806,transparent)]" />
      <motion.div
        className="flex w-max gap-3"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, duration: 28, ease: "linear" }}
      >
        {cards.map((item, index) => (
          <div
            key={`${item.title}-${index}`}
            className="w-72 shrink-0 rounded-lg border border-white/[0.1] bg-white/[0.055] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-md"
          >
            <div className="mb-10 flex items-center justify-between text-xs">
              <span className="rounded-full border border-teal-200/[0.25] bg-teal-200/[0.08] px-2 py-1 text-teal-100">
                {item.tag}
              </span>
              <span className="text-white/[0.26]">score {(0.91 - (index % 5) * 0.04).toFixed(2)}</span>
            </div>
            <h3 className="text-lg font-semibold leading-tight">{item.title}</h3>
            <p className="mt-3 text-xs leading-5 text-white/[0.42]">{item.meta}</p>
          </div>
        ))}
      </motion.div>
      <motion.div
        className="mt-3 flex w-max gap-3"
        animate={{ x: ["-50%", "0%"] }}
        transition={{ repeat: Infinity, duration: 34, ease: "linear" }}
      >
        {cards.map((item, index) => (
          <div
            key={`${item.title}-reverse-${index}`}
            className="w-64 shrink-0 rounded-lg border border-amber-200/[0.12] bg-black/[0.18] p-4 backdrop-blur-md"
          >
            <div className="mb-7 flex items-center gap-2 text-xs text-amber-100/[0.72]">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-200" />
              {item.tag}
            </div>
            <h3 className="text-base font-semibold leading-tight">{item.title}</h3>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function JurisdictionSignal() {
  const nodes = [
    { title: "Federal Acts", detail: "source law", x: "6%", y: "17%" },
    { title: "Ordinances", detail: "legal history", x: "63%", y: "12%" },
    { title: "Regulations", detail: "compliance", x: "68%", y: "58%" },
    { title: "Contracts", detail: "uploaded facts", x: "8%", y: "64%" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 34, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: false, amount: 0.42 }}
      transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
      className="relative mx-auto h-[430px] w-full max-w-[540px] sm:h-[520px]"
    >
      <div className="absolute inset-0 rounded-lg border border-white/[0.1] bg-white/[0.035] shadow-[0_38px_130px_rgba(0,0,0,0.32)]" />
      <div className="absolute inset-6 rounded-lg border border-white/[0.06]" />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
        className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal-200/[0.22] sm:h-80 sm:w-80"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 22, ease: "linear" }}
        className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-200/[0.24] sm:h-56 sm:w-56"
      />
      <div className="absolute left-1/2 top-1/2 h-px w-[82%] -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.32),transparent)]" />
      <div className="absolute left-1/2 top-[10%] h-[80%] w-px bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.28),transparent)]" />

      <motion.div
        animate={{ scale: [1, 1.035, 1] }}
        transition={{ repeat: Infinity, duration: 4.4, ease: "easeInOut" }}
        className="absolute left-1/2 top-1/2 w-40 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-white/[0.14] bg-[#0b120f]/90 p-4 text-center backdrop-blur-md sm:w-48 sm:p-5"
      >
        <Landmark className="mx-auto mb-5 h-7 w-7 text-amber-200" />
        <p className="text-xs text-white/[0.42]">primary corpus</p>
        <h3 className="mt-1 text-xl font-semibold sm:text-2xl">Pakistan Code</h3>
      </motion.div>

      {nodes.map((node, index) => (
        <motion.div
          key={node.title}
          style={{ left: node.x, top: node.y }}
          animate={{ y: [0, -8, 0], opacity: [0.78, 1, 0.78] }}
          transition={{ repeat: Infinity, duration: 4.2 + index * 0.55, delay: index * 0.22, ease: "easeInOut" }}
          className="absolute w-28 rounded-lg border border-white/[0.1] bg-white/[0.065] p-2 backdrop-blur-md sm:w-36 sm:p-3"
        >
          <div className="mb-6 h-1.5 w-10 rounded-full bg-teal-200/70" />
          <h4 className="text-xs font-semibold sm:text-sm">{node.title}</h4>
          <p className="mt-1 text-xs text-white/[0.42]">{node.detail}</p>
        </motion.div>
      ))}

      <div className="absolute bottom-7 left-7 right-7 rounded-lg border border-white/[0.08] bg-black/[0.18] p-4">
        <div className="mb-3 flex items-center justify-between text-xs text-white/[0.44]">
          <span>citation confidence</span>
          <span>live retrieval</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.1]">
          <motion.div
            className="h-full rounded-full bg-[linear-gradient(90deg,#5eead4,#fbbf24)]"
            animate={{ x: ["-35%", "0%", "-35%"] }}
            transition={{ repeat: Infinity, duration: 4.8, ease: "easeInOut" }}
            style={{ width: "82%" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function GlassObject() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36, scale: 0.86 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.22, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-0 mt-8 h-56 w-56 md:h-72 md:w-72"
    >
      <motion.div
        animate={{ rotate: [0, 4, -3, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        className="absolute inset-7 rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffd9a8,#d86c28_46%,#3a1208_72%,#090806)] shadow-[0_30px_100px_rgba(249,115,22,0.36)]"
      />
      <div className="absolute inset-0 rounded-full border border-white/20 bg-[radial-gradient(circle_at_center,transparent_42%,rgba(255,255,255,0.12)_44%,transparent_58%)]" />
      <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/30 bg-[#b85f22]/60 backdrop-blur-md md:h-36 md:w-36" />
      <div className="absolute bottom-5 left-8 h-16 w-36 rotate-[-16deg] rounded-full bg-black/30 blur-xl" />
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 4.6, ease: "easeInOut" }}
        className="absolute -right-8 top-14 rounded-lg border border-white/[0.14] bg-white/[0.08] p-3 text-left backdrop-blur-md"
      >
        <FileSearch className="mb-5 h-5 w-5 text-teal-200" />
        <p className="text-xs text-white/70">retrieved clause</p>
      </motion.div>
    </motion.div>
  );
}

function DocumentDesk() {
  const documents = [
    { title: "Services Agreement", rotate: -6, top: "top-6", left: "left-4" },
    { title: "SECP Compliance", rotate: 3, top: "top-20", left: "left-28" },
    { title: "Lease Review", rotate: -2, top: "top-44", left: "left-14" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.5 }}
      transition={{ duration: 0.6 }}
      className="relative min-h-[460px]"
    >
      <div className="absolute inset-x-0 bottom-0 h-24 rounded-[50%] bg-black/20 blur-2xl" />
      <div className="absolute inset-0 rounded-lg border border-[#5c351e]/20 bg-[#a96736]/[0.18]" />
      <motion.div
        className="absolute left-0 right-0 top-28 h-px bg-[#140d08]/25"
        animate={{ y: [0, 190, 0], opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 4.6, ease: "easeInOut" }}
      />
      {documents.map((doc, index) => (
        <motion.div
          key={doc.title}
          initial={{ opacity: 0, y: 56, scale: 0.94, rotate: doc.rotate + 6 }}
          whileInView={{ opacity: 1, y: 0, scale: 1, rotate: doc.rotate }}
          viewport={{ once: false, amount: 0.45 }}
          transition={{ duration: 0.62, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
          className={`absolute ${doc.top} ${doc.left} w-72 rounded-md border border-[#cbb892] bg-[#fff7df] p-5 shadow-2xl`}
        >
          <div className="mb-5 flex items-center justify-between text-xs text-[#29170d]/[0.52]">
            <span>LEXORA</span>
            <FileText className="h-4 w-4" />
          </div>
          <h3 className="text-xl font-semibold">{doc.title}</h3>
          <div className="mt-5 space-y-2">
            <span className="block h-2 w-full rounded bg-[#2a190f]/[0.18]" />
            <span className="block h-2 w-10/12 rounded bg-[#2a190f]/[0.14]" />
            <span className="block h-2 w-8/12 rounded bg-[#2a190f]/[0.14]" />
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs text-teal-800">
            <CheckCircle2 className="h-4 w-4" />
            source linked
          </div>
        </motion.div>
      ))}
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [0, 1.5, 0] }}
        transition={{ repeat: Infinity, duration: 5.2, ease: "easeInOut" }}
        className="absolute bottom-10 right-6 w-64 rounded-md border border-[#2b1308]/[0.18] bg-[#17100a] p-4 text-white shadow-2xl"
      >
        <BookOpen className="mb-8 h-5 w-5 text-amber-300" />
        <div className="text-3xl font-semibold">1,000</div>
        <p className="mt-2 text-xs leading-5 text-white/[0.48]">legal sources indexed into searchable context</p>
      </motion.div>
    </motion.div>
  );
}

function RiskDevice() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 34, rotate: 3 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: false, amount: 0.5 }}
      transition={{ duration: 0.62 }}
      className="relative mx-auto h-[430px] w-full max-w-[460px] sm:h-[520px]"
    >
      <div className="absolute inset-x-7 bottom-4 h-16 rounded-[50%] bg-black/[0.28] blur-2xl" />
      <div className="absolute inset-0 rounded-lg border border-white/[0.26] bg-[#150705] p-3 shadow-[0_38px_130px_rgba(0,0,0,0.42)]">
        <div className="flex h-9 items-center gap-2 border-b border-white/10 px-2">
          <span className="h-2 w-2 rounded-full bg-red-300" />
          <span className="h-2 w-2 rounded-full bg-amber-200" />
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
          <span className="ml-auto text-xs text-white/[0.36]">clause-risk.lexora</span>
        </div>
        <div className="relative h-[365px] overflow-hidden rounded-b-md bg-[#f6eee0] text-[#180b06] sm:h-[455px]">
          <div className="absolute inset-x-0 top-0 h-28 bg-[#d71911]" />
          <div className="relative z-10 p-6">
            <p className="text-xs text-white/80">RISK DETECTION</p>
            <h3 className="mt-2 text-4xl font-semibold leading-none text-white sm:text-5xl">Liability cap</h3>
          </div>
          <div className="absolute left-6 right-6 top-40 rounded-md border border-[#dbcab4] bg-white p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-red-600" />
              <div>
                <h4 className="font-semibold">High risk clause</h4>
                <p className="mt-2 text-sm leading-6 text-[#4b3329]">
                  The agreement creates uncapped exposure and does not limit indirect damages.
                </p>
              </div>
            </div>
          </div>
          <div className="absolute bottom-6 left-6 right-6 grid grid-cols-2 gap-3">
            <div className="rounded-md bg-[#170b06] p-4 text-white">
              <Gavel className="mb-4 h-4 w-4 text-amber-300" />
              <div className="text-2xl font-semibold">82%</div>
              <p className="text-xs text-white/[0.46]">risk score</p>
            </div>
            <div className="rounded-md bg-[#170b06] p-4 text-white">
              <Database className="mb-4 h-4 w-4 text-teal-300" />
              <div className="text-2xl font-semibold">7</div>
              <p className="text-xs text-white/[0.46]">citations</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RiskTicker() {
  const risks = [
    "uncapped liability",
    "missing governing law",
    "one-sided termination",
    "broad indemnity",
    "silent renewal",
    "weak notice period",
  ];
  const loop = [...risks, ...risks];

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-7 hidden overflow-hidden md:block">
      <motion.div
        className="flex w-max gap-3"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, duration: 26, ease: "linear" }}
      >
        {loop.map((risk, index) => (
          <div
            key={`${risk}-${index}`}
            className="flex h-16 w-64 shrink-0 items-center justify-between rounded-lg border border-white/[0.22] bg-white/[0.14] px-4 text-white backdrop-blur-md"
          >
            <span className="text-sm font-medium">{risk}</span>
            <span className="rounded-full bg-[#150705] px-2 py-1 text-xs text-amber-200">
              {index % 3 === 0 ? "HIGH" : index % 3 === 1 ? "MED" : "LOW"}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function AccessCardFan() {
  const cards = [
    { title: "Upload", detail: "contracts, PDFs, DOCX", rotate: -8, y: 18 },
    { title: "Ask", detail: "grounded legal chat", rotate: 0, y: 0 },
    { title: "Defend", detail: "citations and audit trail", rotate: 8, y: 18 },
  ];

  return (
    <div className="relative mx-auto mt-10 hidden h-44 max-w-3xl md:block">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 54, rotate: 0 }}
          whileInView={{ opacity: 1, y: card.y, rotate: card.rotate }}
          whileHover={{ y: card.y - 10, scale: 1.03 }}
          viewport={{ once: false, amount: 0.6 }}
          transition={{ duration: 0.62, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-0 w-72 rounded-lg border border-white/[0.12] bg-white/[0.065] p-5 text-left shadow-[0_30px_100px_rgba(0,0,0,0.28)] backdrop-blur-md"
          style={{ left: `calc(50% + ${(index - 1) * 170 - 144}px)` }}
        >
          <p className="text-xs text-teal-200/[0.72]">0{index + 1}</p>
          <h3 className="mt-8 text-2xl font-semibold">{card.title}</h3>
          <p className="mt-2 text-sm text-white/[0.46]">{card.detail}</p>
        </motion.div>
      ))}
    </div>
  );
}

function MiniSpec({ label, value, center = false }: { label: string; value: string; center?: boolean }) {
  return (
    <div className={`border-t border-white/[0.16] pt-3 ${center ? "md:text-center" : ""}`}>
      <p className="text-xs text-white/[0.38]">{label}</p>
      <p className="mt-1 text-sm text-white/[0.76]">{value}</p>
    </div>
  );
}

function Proof({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.015 }}
      viewport={{ once: false, amount: 0.5 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-lg border border-white/10 bg-white/[0.04] p-5 text-left"
    >
      <Icon className="mb-8 h-5 w-5 text-teal-300" />
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/[0.48]">{text}</p>
    </motion.div>
  );
}
