import { GlowCard } from "@/components/animated/glow-card";
import { getCurrentUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Settings, User, Shield, Sparkles, CreditCard } from "lucide-react";
import { PageTransition } from "@/components/animated/page-transition";
import { getSubscriptionContext } from "@/lib/services/subscription-service";
import Link from "next/link";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const subscription = await getSubscriptionContext(user.id, user.role);
  const isLawyer = user.role === "LAWYER";
  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-7 w-7 text-lex-500" /> Settings
          </h1>
        </div>

        <GlowCard className="p-6">
          <div className="flex items-center gap-2 mb-4"><User className="h-4 w-4 text-lex-500" /><h3 className="font-semibold">Profile</h3></div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><div className="text-xs text-muted-foreground mb-0.5">Name</div><div className="font-medium">{user.name}</div></div>
            <div><div className="text-xs text-muted-foreground mb-0.5">Email</div><div className="font-medium">{user.email}</div></div>
            <div><div className="text-xs text-muted-foreground mb-0.5">Role</div><Badge variant="info">{user.role}</Badge></div>
            <div><div className="text-xs text-muted-foreground mb-0.5">Status</div><Badge variant="success">{user.status}</Badge></div>
          </div>
        </GlowCard>

        <GlowCard className="relative overflow-hidden p-6">
          <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-primary/10 to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="h-4 w-4 text-lex-500" />
              <h3 className="font-semibold">Workspace setup</h3>
              <Badge variant={user.onboardingComplete ? "success" : "outline"}>
                {user.onboardingComplete ? "Complete" : "Pending"}
              </Badge>
            </div>
            <p className="mb-5 text-sm leading-6 text-muted-foreground">
              {isLawyer
                ? "Lexora is configured as counsel support: retrieval, citations, draft scaffolds and review queues are built around your practice, not around replacing your judgment."
                : "Lexora uses this profile to make drafts, chat responses and dashboard prompts feel specific to your matter."}
            </p>
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <ProfileField label={isLawyer ? "Firm / chamber" : "Company / organization"} value={user.organization} />
              <ProfileField label="Jurisdiction" value={user.jurisdiction || "Pakistan"} />
              {isLawyer ? <ProfileField label="Bar number" value={user.barNumber} /> : <ProfileField label="User context" value={user.persona} />}
              <ProfileField label={isLawyer ? "Practice area" : "Legal focus"} value={user.practiceArea} />
              <ProfileField label="Response style" value={user.preferredTone} />
              <ProfileField label="Primary use case" value={user.primaryUseCase} />
            </div>
          </div>
        </GlowCard>

        <GlowCard className="p-6">
          <div className="flex items-center gap-2 mb-4"><Shield className="h-4 w-4 text-lex-500" /><h3 className="font-semibold">Security</h3></div>
          <p className="text-sm text-muted-foreground">Password hashing: bcrypt (cost 10). JWT in HTTP-only SameSite-lax cookie. Sessions persist for 90 days unless the user signs out.</p>
        </GlowCard>

        <GlowCard className="p-6">
          <div className="flex items-center gap-2 mb-4"><CreditCard className="h-4 w-4 text-lex-500" /><h3 className="font-semibold">Subscription</h3></div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">{subscription.plan.name}</p>
              <p className="text-sm text-muted-foreground">{subscription.status} · role-aware access enabled</p>
            </div>
            <Button asChild variant="outline"><Link href="/billing">Manage</Link></Button>
          </div>
        </GlowCard>

        <GlowCard className="p-6">
          <div className="flex items-center gap-2 mb-4"><Sparkles className="h-4 w-4 text-lex-500" /><h3 className="font-semibold">AI</h3></div>
          <p className="text-sm text-muted-foreground">{process.env.OPENAI_API_KEY ? "OpenAI key configured. Real inference enabled." : "OpenAI key not configured. Running in deterministic mock mode."}</p>
        </GlowCard>
      </div>
    </PageTransition>
  );
}

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border bg-background/40 p-3">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="font-medium">{value || "Not set"}</div>
    </div>
  );
}
