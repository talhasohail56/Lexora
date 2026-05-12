export type AppRole = "USER" | "LAWYER" | "ADMIN";

export type SubscriptionStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED";

export type SubscriptionFeature =
  | "dashboard"
  | "documents"
  | "documentUpload"
  | "aiAnalysis"
  | "chatMessages"
  | "semanticSearches"
  | "legalCorpusAccess"
  | "drafts"
  | "complianceRuns"
  | "comparisons"
  | "timelines"
  | "annotations"
  | "negotiator"
  | "forecast"
  | "voiceBriefs"
  | "notifications"
  | "team"
  | "settings"
  | "billing"
  | "admin";

export type PlanLimit = number | "unlimited" | boolean;
export type PlanLimitMap = Partial<Record<SubscriptionFeature, PlanLimit>>;

export type DefaultPlan = {
  code: string;
  name: string;
  description: string;
  audienceRole: AppRole | "ALL";
  priceCents: number;
  billingInterval: "MONTH" | "YEAR";
  sortOrder: number;
  features: SubscriptionFeature[];
  limits: PlanLimitMap;
};

export type SubscriptionContext = {
  isAdmin: boolean;
  role: AppRole;
  status: SubscriptionStatus;
  currentPeriodEnd: string | Date | null;
  trialEndsAt: string | Date | null;
  cancelAtPeriodEnd: boolean;
  plan: {
    id?: string;
    code: string;
    name: string;
    audienceRole: AppRole | "ALL";
    priceCents: number;
    billingInterval: string;
    features: SubscriptionFeature[];
    limits: PlanLimitMap;
  };
  usage: Partial<Record<SubscriptionFeature, number>>;
};

export const ALWAYS_AVAILABLE_FEATURES: SubscriptionFeature[] = [
  "dashboard",
  "notifications",
  "settings",
  "billing",
];

export const FEATURE_LABELS: Record<SubscriptionFeature, string> = {
  dashboard: "Dashboard",
  documents: "Documents",
  documentUpload: "Document upload",
  aiAnalysis: "AI analysis",
  chatMessages: "AI chat",
  semanticSearches: "Semantic search",
  legalCorpusAccess: "Legal library",
  drafts: "Drafting",
  complianceRuns: "Compliance",
  comparisons: "Document compare",
  timelines: "Timeline extraction",
  annotations: "Lawyer annotations",
  negotiator: "Negotiation simulator",
  forecast: "Court forecast",
  voiceBriefs: "Voice brief",
  notifications: "Notifications",
  team: "Team workspace",
  settings: "Settings",
  billing: "Billing",
  admin: "Admin",
};

export const ROLE_REQUIREMENTS: Partial<Record<SubscriptionFeature, AppRole[]>> = {
  annotations: ["LAWYER", "ADMIN"],
  admin: ["ADMIN"],
};

export const DEFAULT_PLANS: DefaultPlan[] = [
  {
    code: "STARTER",
    name: "User Starter",
    description: "For individuals, students, founders, and clients who need clear document answers without lawyer-only tools.",
    audienceRole: "USER",
    priceCents: 0,
    billingInterval: "MONTH",
    sortOrder: 10,
    features: [
      "dashboard",
      "documents",
      "documentUpload",
      "aiAnalysis",
      "chatMessages",
      "semanticSearches",
      "legalCorpusAccess",
      "drafts",
      "notifications",
      "settings",
      "billing",
    ],
    limits: {
      documents: 2,
      documentUpload: 2,
      aiAnalysis: 5,
      chatMessages: 25,
      semanticSearches: 25,
      legalCorpusAccess: true,
      drafts: 2,
    },
  },
  {
    code: "PRO",
    name: "User Professional",
    description: "A complete client-side legal workspace for documents, RAG chat, compliance checks, comparison, timelines, and drafting.",
    audienceRole: "USER",
    priceCents: 1900,
    billingInterval: "MONTH",
    sortOrder: 20,
    features: [
      "dashboard",
      "documents",
      "documentUpload",
      "aiAnalysis",
      "chatMessages",
      "semanticSearches",
      "legalCorpusAccess",
      "drafts",
      "complianceRuns",
      "comparisons",
      "timelines",
      "negotiator",
      "forecast",
      "voiceBriefs",
      "notifications",
      "team",
      "settings",
      "billing",
    ],
    limits: {
      documents: 50,
      documentUpload: 50,
      aiAnalysis: 120,
      chatMessages: 500,
      semanticSearches: 400,
      legalCorpusAccess: true,
      drafts: 50,
      complianceRuns: 80,
      comparisons: 50,
      timelines: 60,
      negotiator: 80,
      forecast: 50,
      voiceBriefs: 60,
    },
  },
  {
    code: "LAWYER_TRIAL",
    name: "Lawyer Trial",
    description: "A 14-day counsel-first workspace trial with annotations, review trails, and advanced legal analysis.",
    audienceRole: "LAWYER",
    priceCents: 0,
    billingInterval: "MONTH",
    sortOrder: 30,
    features: [
      "dashboard",
      "documents",
      "documentUpload",
      "aiAnalysis",
      "chatMessages",
      "semanticSearches",
      "legalCorpusAccess",
      "drafts",
      "complianceRuns",
      "comparisons",
      "timelines",
      "annotations",
      "negotiator",
      "forecast",
      "voiceBriefs",
      "notifications",
      "settings",
      "billing",
    ],
    limits: {
      documents: 10,
      documentUpload: 10,
      aiAnalysis: 40,
      chatMessages: 150,
      semanticSearches: 120,
      legalCorpusAccess: true,
      drafts: 15,
      complianceRuns: 25,
      comparisons: 20,
      timelines: 20,
      annotations: 100,
      negotiator: 25,
      forecast: 20,
      voiceBriefs: 20,
    },
  },
  {
    code: "LAWYER",
    name: "Lawyer Pro",
    description: "For practicing lawyers who want faster review without surrendering professional judgment or client strategy.",
    audienceRole: "LAWYER",
    priceCents: 4900,
    billingInterval: "MONTH",
    sortOrder: 40,
    features: [
      "dashboard",
      "documents",
      "documentUpload",
      "aiAnalysis",
      "chatMessages",
      "semanticSearches",
      "legalCorpusAccess",
      "drafts",
      "complianceRuns",
      "comparisons",
      "timelines",
      "annotations",
      "negotiator",
      "forecast",
      "voiceBriefs",
      "notifications",
      "settings",
      "billing",
    ],
    limits: {
      documents: 200,
      documentUpload: 200,
      aiAnalysis: 500,
      chatMessages: 2000,
      semanticSearches: 1500,
      legalCorpusAccess: true,
      drafts: 250,
      complianceRuns: 300,
      comparisons: 250,
      timelines: 250,
      annotations: 2000,
      negotiator: 300,
      forecast: 250,
      voiceBriefs: 250,
    },
  },
  {
    code: "FIRM",
    name: "Firm / Admin",
    description: "Unlimited firm workspace with admin controls, team access, and role-aware legal AI governance.",
    audienceRole: "ALL",
    priceCents: 14900,
    billingInterval: "MONTH",
    sortOrder: 50,
    features: [
      "dashboard",
      "documents",
      "documentUpload",
      "aiAnalysis",
      "chatMessages",
      "semanticSearches",
      "legalCorpusAccess",
      "drafts",
      "complianceRuns",
      "comparisons",
      "timelines",
      "annotations",
      "negotiator",
      "forecast",
      "voiceBriefs",
      "notifications",
      "settings",
      "billing",
      "admin",
    ],
    limits: {
      documents: "unlimited",
      documentUpload: "unlimited",
      aiAnalysis: "unlimited",
      chatMessages: "unlimited",
      semanticSearches: "unlimited",
      legalCorpusAccess: true,
      drafts: "unlimited",
      complianceRuns: "unlimited",
      comparisons: "unlimited",
      timelines: "unlimited",
      annotations: "unlimited",
      negotiator: "unlimited",
      forecast: "unlimited",
      voiceBriefs: "unlimited",
      team: true,
      admin: true,
    },
  },
];

export const PATH_FEATURES: { prefix: string; feature: SubscriptionFeature }[] = [
  { prefix: "/admin", feature: "admin" },
  { prefix: "/billing", feature: "billing" },
  { prefix: "/settings", feature: "settings" },
  { prefix: "/notifications", feature: "notifications" },
  { prefix: "/team", feature: "team" },
  { prefix: "/documents/upload", feature: "documentUpload" },
  { prefix: "/documents", feature: "documents" },
  { prefix: "/chat", feature: "chatMessages" },
  { prefix: "/search", feature: "semanticSearches" },
  { prefix: "/library", feature: "legalCorpusAccess" },
  { prefix: "/glossary", feature: "legalCorpusAccess" },
  { prefix: "/draft", feature: "drafts" },
  { prefix: "/compliance", feature: "complianceRuns" },
  { prefix: "/compare", feature: "comparisons" },
  { prefix: "/timeline", feature: "timelines" },
  { prefix: "/annotations", feature: "annotations" },
  { prefix: "/negotiator", feature: "negotiator" },
  { prefix: "/forecast", feature: "forecast" },
  { prefix: "/voice-brief", feature: "voiceBriefs" },
  { prefix: "/dashboard", feature: "dashboard" },
];

export function featureForPath(pathname: string): SubscriptionFeature {
  return PATH_FEATURES.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`))?.feature ?? "dashboard";
}

export function isActiveStatus(status: string | null | undefined) {
  return status === "ACTIVE" || status === "TRIALING";
}

export function formatPlanPrice(priceCents: number) {
  if (priceCents === 0) return "Free";
  return `$${(priceCents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}/mo`;
}

export function isLimitUnlimited(limit: PlanLimit | undefined) {
  return limit === true || limit === "unlimited";
}

export function getPlanLimit(ctx: SubscriptionContext, feature: SubscriptionFeature) {
  return ctx.plan.limits[feature] ?? DEFAULT_PLANS.find((plan) => plan.code === ctx.plan.code)?.limits[feature];
}

function planIncludesFeature(ctx: SubscriptionContext, feature: SubscriptionFeature) {
  if (ctx.plan.features.includes(feature)) return true;
  return Boolean(DEFAULT_PLANS.find((plan) => plan.code === ctx.plan.code)?.features.includes(feature));
}

export function canRoleUseFeature(role: AppRole, feature: SubscriptionFeature) {
  const allowed = ROLE_REQUIREMENTS[feature];
  return !allowed || allowed.includes(role);
}

export function canUseFeature(ctx: SubscriptionContext, feature: SubscriptionFeature) {
  if (ctx.isAdmin) return true;
  if (ALWAYS_AVAILABLE_FEATURES.includes(feature)) return true;
  if (!isActiveStatus(ctx.status)) return false;
  if (!canRoleUseFeature(ctx.role, feature)) return false;
  if (!planIncludesFeature(ctx, feature)) return false;
  const limit = getPlanLimit(ctx, feature);
  if (isLimitUnlimited(limit)) return true;
  if (typeof limit === "number") return (ctx.usage[feature] ?? 0) < limit;
  return limit !== false;
}

export function subscriptionBlockReason(ctx: SubscriptionContext, feature: SubscriptionFeature) {
  if (ctx.isAdmin) return null;
  if (!isActiveStatus(ctx.status) && !ALWAYS_AVAILABLE_FEATURES.includes(feature)) {
    return "Your subscription is inactive. Update billing to continue.";
  }
  if (!canRoleUseFeature(ctx.role, feature)) {
    return `${FEATURE_LABELS[feature]} requires a lawyer seat.`;
  }
  if (!planIncludesFeature(ctx, feature)) {
    return `${FEATURE_LABELS[feature]} is not included in ${ctx.plan.name}.`;
  }
  const limit = getPlanLimit(ctx, feature);
  if (typeof limit === "number" && (ctx.usage[feature] ?? 0) >= limit) {
    return `${FEATURE_LABELS[feature]} limit reached for this billing period.`;
  }
  return null;
}
