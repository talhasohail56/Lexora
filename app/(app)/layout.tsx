import { Sidebar } from "@/components/layout/sidebar";
import { OnboardingSetup } from "@/components/onboarding/setup-card";
import { Topbar } from "@/components/layout/topbar";
import { SubscriptionGate } from "@/components/subscription/subscription-gate";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSubscriptionContext } from "@/lib/services/subscription-service";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const [subscription, profile] = await Promise.all([
    getSubscriptionContext(session.userId, session.role, { includeUsage: false }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        onboardingComplete: true,
        organization: true,
        jurisdiction: true,
        barNumber: true,
        persona: true,
        practiceArea: true,
        primaryUseCase: true,
        preferredTone: true,
      },
    }),
  ]);

  return (
    <div className="min-h-screen flex bg-[linear-gradient(135deg,hsl(var(--background)),hsl(var(--background))_62%,hsl(var(--primary)/0.05))]">
      <Sidebar role={session.role} subscription={subscription} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          user={{ name: profile?.name ?? session.name, email: session.email, role: session.role, avatarUrl: profile?.avatarUrl }}
          subscription={subscription}
        />
        <main className="flex-1 p-8 overflow-x-hidden">
          <SubscriptionGate context={subscription}>{children}</SubscriptionGate>
        </main>
      </div>
      {profile && profile.role !== "ADMIN" && !profile.onboardingComplete ? (
        <OnboardingSetup profile={profile} />
      ) : null}
    </div>
  );
}
