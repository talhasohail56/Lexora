"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CreditCard,
  Crown,
  FileText,
  Lock,
  Scale,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_PLANS,
  FEATURE_LABELS,
  type SubscriptionFeature,
  formatPlanPrice,
} from "@/lib/subscription-config";

type Plan = (typeof DEFAULT_PLANS)[number];

const rail = ["Start", "Plans", "Roles", "Access"];

const heroSignals = [
  { label: "role gate", value: "USER / LAWYER / ADMIN", x: "left-[7%]", y: "top-[26%]", rotate: -4 },
  { label: "usage meter", value: "per billing period", x: "right-[8%]", y: "top-[24%]", rotate: 4 },
  { label: "plan lock", value: "feature-level", x: "left-[12%]", y: "bottom-[17%]", rotate: 3 },
  { label: "checkout mode", value: "mock now / Stripe ready", x: "right-[12%]", y: "bottom-[18%]", rotate: -3 },
];

const comparisonFeatures: SubscriptionFeature[] = [
  "documentUpload",
  "chatMessages",
  "semanticSearches",
  "drafts",
  "complianceRuns",
  "comparisons",
  "annotations",
  "forecast",
];

export default function PricingPage() {
  return (
    <main className="h-screen snap-y snap-mandatory overflow-y-auto scroll-smooth overscroll-y-contain bg-[#080806] text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <PricingBrand />
      <PricingRail />

      <Scene id="pricing-hero" className="bg-[#080806]">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,#130806_0%,#080806_38%,#151107_68%,#2c0b08_100%)]" />
        <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),transparent)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:46px_46px]" />
        <HeroSignals />

        <div className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-5 pt-20 text-center">
          <motion.p
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="mb-5 text-xs text-white/[0.55]"
          >
            BILLING SYSTEM / ROLE GATES / USAGE LIMITS
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 26, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-6xl text-6xl font-semibold leading-none md:text-8xl lg:text-9xl"
          >
            Pay for access.
            <br />
            Unlock the machine.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.6 }}
            className="mt-7 max-w-2xl text-sm leading-6 text-white/[0.54] md:text-base"
          >
            Plans control documents, RAG, drafting, compliance, lawyer annotations and admin power across the whole product.
          </motion.p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-[#080806] hover:bg-white/90">
              <Link href="/register">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <Link href="#plans">View plans</Link>
            </Button>
          </div>
        </div>
      </Scene>

      <Scene id="plans" className="bg-[#d8c59f] text-[#140d08]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#8a4022_0%,#d7b981_21%,#f1e4c8_56%,#a85b2d_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.58),transparent_34%,rgba(0,0,0,0.2)_100%)]" />
        <div className="relative z-10 flex min-h-[100svh] items-center px-5 py-24 md:px-10">
          <div className="grid w-full items-center gap-10 md:grid-cols-[0.8fr_1.2fr]">
            <motion.div
              initial={{ opacity: 0, x: -28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.45 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="mb-5 text-xs text-[#140d08]/[0.58]">THE PLAN STACK</p>
              <h2 className="max-w-3xl text-6xl font-semibold leading-none md:text-8xl">
                Every card unlocks a different legal workspace.
              </h2>
              <p className="mt-6 max-w-md text-sm leading-6 text-[#140d08]/[0.64] md:text-base">
                Starter feels lightweight. Pro unlocks real work. Lawyer Pro opens review tools. Firm turns everything on.
              </p>
            </motion.div>
            <PlanStack />
          </div>
        </div>
      </Scene>

      <Scene id="plan-strip" className="bg-[#0b0d09]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#06110e_0%,#100806_48%,#250905_100%)]" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:52px_52px]" />
        <div className="relative z-10 flex min-h-[100svh] flex-col justify-center px-5 py-24 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 28, filter: "blur(9px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: false, amount: 0.45 }}
            transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-5xl text-center"
          >
            <p className="mb-4 text-xs text-teal-200/[0.72]">HORIZONTAL PLAN RAIL</p>
            <h2 className="text-5xl font-semibold leading-none md:text-8xl">Swipe through the access levels.</h2>
          </motion.div>
          <PlanMarquee />
        </div>
      </Scene>

      <Scene id="roles" className="bg-[#140806]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#1b0705,#2a0905_45%,#070908_100%)]" />
        <div className="absolute left-0 top-0 h-full w-1/3 bg-[linear-gradient(90deg,rgba(249,115,22,0.20),transparent)]" />
        <div className="relative z-10 flex min-h-[100svh] items-center px-5 py-24 md:px-10">
          <div className="grid w-full items-center gap-10 md:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="mb-4 text-xs text-white/[0.44]">ROLE-BASED ACCESS</p>
              <motion.h2
                initial={{ opacity: 0, y: 28, filter: "blur(9px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: false, amount: 0.55 }}
                transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-5xl text-5xl font-semibold leading-none sm:text-6xl md:text-8xl"
              >
                Roles do not just label users. They unlock tools.
              </motion.h2>
            </div>
            <RoleMatrix />
          </div>
        </div>
      </Scene>

      <Scene id="access" className="bg-[#eb2b14]">
        <div className="absolute inset-0 bg-[linear-gradient(100deg,#d91f12_0%,#ee4a18_46%,#f6b26b_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.18),transparent_50%,rgba(255,255,255,0.16))]" />
        <div className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-5 py-24 text-center md:px-10">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.55 }}
            className="mb-4 text-xs text-white/[0.72]"
          >
            START WHERE YOU ARE
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-6xl text-6xl font-semibold leading-none md:text-8xl lg:text-9xl"
          >
            Pick a plan.
            <br />
            The gates handle the rest.
          </motion.h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-[#090c09] hover:bg-white/90">
              <Link href="/register?plan=PRO">
                Choose Professional <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/[0.24] bg-white/10 text-white hover:bg-white/15 hover:text-white">
              <Link href="/login">I already have access</Link>
            </Button>
          </div>
        </div>
      </Scene>
    </main>
  );
}

function PricingBrand() {
  return (
    <header className="pointer-events-none fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-5 py-5 text-white md:px-7">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/[0.22] px-3 py-2 text-xs font-semibold backdrop-blur-md">
        <Scale className="h-4 w-4" />
        LEXORA
      </div>
      <div className="pointer-events-auto rounded-full border border-white/[0.08] bg-black/[0.18] px-3 py-2 text-xs text-white/[0.5] backdrop-blur-md">
        Pricing
      </div>
    </header>
  );
}

function PricingRail() {
  return (
    <div className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex">
      <div className="h-44 w-px bg-white/20">
        <motion.div
          className="w-px bg-white"
          animate={{ height: ["12%", "92%", "12%"] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
        />
      </div>
      {rail.map((item, index) => (
        <span key={item} className="relative flex h-8 w-8 items-center justify-center text-[10px] text-white/[0.42]">
          <motion.span
            className="absolute inset-0 rounded-full border border-white/[0.08]"
            animate={{ scale: [1, 1.16, 1], opacity: [0.25, 0.72, 0.25] }}
            transition={{ repeat: Infinity, duration: 2.8, delay: index * 0.18, ease: "easeInOut" }}
          />
          {item.slice(0, 2)}
        </span>
      ))}
    </div>
  );
}

function Scene({ id, className, children }: { id: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={`relative min-h-[100svh] snap-start overflow-hidden [scroll-snap-stop:always] ${className ?? ""}`}>
      {children}
    </section>
  );
}

function HeroSignals() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] hidden md:block">
      {heroSignals.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 34, rotate: card.rotate }}
          animate={{ opacity: 1, y: [0, -12, 0], rotate: [card.rotate, card.rotate * 1.45, card.rotate] }}
          transition={{
            opacity: { delay: 0.35 + index * 0.08, duration: 0.55 },
            y: { repeat: Infinity, duration: 5 + index * 0.45, ease: "easeInOut" },
            rotate: { repeat: Infinity, duration: 6 + index * 0.4, ease: "easeInOut" },
          }}
          className={`absolute w-56 rounded-lg border border-white/[0.1] bg-white/[0.06] p-4 text-left shadow-[0_28px_90px_rgba(0,0,0,0.3)] backdrop-blur-md ${card.x} ${card.y}`}
        >
          <p className="text-xs text-white/[0.38]">{card.label}</p>
          <p className="mt-6 text-xl font-semibold">{card.value}</p>
        </motion.div>
      ))}
    </div>
  );
}

function PlanStack() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.45 }}
      transition={{ duration: 0.6 }}
      className="relative min-h-[560px]"
    >
      <div className="absolute inset-x-0 bottom-0 h-24 rounded-[50%] bg-black/20 blur-2xl" />
      <div className="absolute inset-0 rounded-lg border border-[#5c351e]/20 bg-[#a96736]/[0.18]" />
      {DEFAULT_PLANS.map((plan, index) => (
        <motion.div
          key={plan.code}
          initial={{ opacity: 0, y: 66, rotate: -8 + index * 4, scale: 0.92 }}
          whileInView={{ opacity: 1, y: 0, rotate: -10 + index * 5, scale: 1 }}
          viewport={{ once: false, amount: 0.45 }}
          transition={{ duration: 0.62, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="absolute w-72 rounded-lg border border-[#2b1308]/[0.14] bg-[#fff7df] p-5 text-[#140d08] shadow-2xl"
          style={{ left: `${7 + index * 13}%`, top: `${7 + (index % 3) * 16}%`, zIndex: 10 + index }}
        >
          <div className="mb-10 flex items-center justify-between text-xs text-[#29170d]/[0.52]">
            <span>{plan.audienceRole}</span>
            {plan.code === "FIRM" ? <Crown className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
          </div>
          <h3 className="text-2xl font-semibold">{plan.name}</h3>
          <p className="mt-3 text-3xl font-semibold">{formatPlanPrice(plan.priceCents)}</p>
          <p className="mt-4 text-sm leading-6 text-[#140d08]/[0.58]">{plan.description}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}

function PlanMarquee() {
  const loop = [...DEFAULT_PLANS, ...DEFAULT_PLANS];
  return (
    <div className="relative mt-12 overflow-hidden py-7">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28 bg-[linear-gradient(90deg,#0b0d09,transparent)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-28 bg-[linear-gradient(270deg,#120806,transparent)]" />
      <motion.div
        className="flex w-max gap-4"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, duration: 36, ease: "linear" }}
      >
        {loop.map((plan, index) => (
          <PlanRailCard key={`${plan.code}-${index}`} plan={plan} />
        ))}
      </motion.div>
    </div>
  );
}

function PlanRailCard({ plan }: { plan: Plan }) {
  return (
    <div className="flex h-[460px] w-80 shrink-0 flex-col rounded-lg border border-white/[0.1] bg-white/[0.055] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-white/[0.4]">{plan.audienceRole}</p>
          <h3 className="mt-2 text-2xl font-semibold">{plan.name}</h3>
        </div>
        {plan.code === "PRO" && <span className="rounded-full bg-teal-200 px-2 py-1 text-xs text-[#06110e]">Best</span>}
      </div>
      <p className="mt-6 text-4xl font-semibold">{formatPlanPrice(plan.priceCents)}</p>
      <p className="mt-4 text-sm leading-6 text-white/[0.48]">{plan.description}</p>
      <div className="mt-6 space-y-3">
        {plan.features.slice(0, 5).map((feature) => (
          <div key={feature} className="flex items-center gap-2 text-sm text-white/[0.72]">
            <Check className="h-4 w-4 text-teal-200" />
            {FEATURE_LABELS[feature] ?? feature}
          </div>
        ))}
      </div>
      <Button asChild className="mt-auto bg-white text-[#080806] hover:bg-white/90">
        <Link href={`/register?plan=${plan.code}`}>
          Choose {plan.name}
        </Link>
      </Button>
    </div>
  );
}

function RoleMatrix() {
  const roles = [
    { label: "User", icon: FileText, enabled: ["documentUpload", "chatMessages", "semanticSearches", "drafts"] },
    { label: "Lawyer", icon: Shield, enabled: ["documentUpload", "complianceRuns", "comparisons", "annotations", "forecast"] },
    { label: "Admin", icon: Users, enabled: comparisonFeatures },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 34, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: false, amount: 0.42 }}
      transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
      className="relative mx-auto w-full max-w-[660px] rounded-lg border border-white/[0.1] bg-white/[0.035] p-4 shadow-[0_38px_130px_rgba(0,0,0,0.32)]"
    >
      <div className="grid grid-cols-[1.1fr_repeat(3,0.65fr)] gap-2 text-xs">
        <div className="p-3 text-white/[0.38]">Feature</div>
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <div key={role.label} className="rounded-md border border-white/[0.08] bg-white/[0.05] p-3 text-center">
              <Icon className="mx-auto mb-2 h-4 w-4 text-teal-200" />
              {role.label}
            </div>
          );
        })}
        {comparisonFeatures.map((feature, rowIndex) => (
          <div key={feature} className="contents">
            <div className="rounded-md border border-white/[0.08] bg-black/[0.18] p-3 text-white/[0.74]">
              {FEATURE_LABELS[feature]}
            </div>
            {roles.map((role, colIndex) => {
              const active = role.enabled.includes(feature);
              return (
                <motion.div
                  key={`${role.label}-${feature}`}
                  animate={active ? { opacity: [0.62, 1, 0.62] } : { opacity: 0.32 }}
                  transition={{ repeat: active ? Infinity : 0, duration: 2.8, delay: (rowIndex + colIndex) * 0.04 }}
                  className={`flex items-center justify-center rounded-md border p-3 ${
                    active
                      ? "border-teal-200/[0.22] bg-teal-200/[0.08] text-teal-100"
                      : "border-white/[0.06] bg-white/[0.025] text-white/[0.26]"
                  }`}
                >
                  {active ? <Check className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-white/[0.08] bg-black/[0.18] p-4 text-sm leading-6 text-white/[0.48]">
        Admins can manage the system. Lawyers get annotation and review power. Users get document and RAG workflows by plan.
      </div>
    </motion.div>
  );
}
