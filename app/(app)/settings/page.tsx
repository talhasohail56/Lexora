import { GlowCard } from "@/components/animated/glow-card";
import { getCurrentUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, User, Shield, Sparkles, CreditCard } from "lucide-react";
import { PageTransition } from "@/components/animated/page-transition";
import { getSubscriptionContext } from "@/lib/services/subscription-service";
import Link from "next/link";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const subscription = await getSubscriptionContext(user.id, user.role);
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

        <GlowCard className="p-6">
          <div className="flex items-center gap-2 mb-4"><Shield className="h-4 w-4 text-lex-500" /><h3 className="font-semibold">Security</h3></div>
          <p className="text-sm text-muted-foreground">Password hashing: bcrypt (cost 10). JWT in HTTP-only SameSite-strict cookie. 24h session.</p>
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
