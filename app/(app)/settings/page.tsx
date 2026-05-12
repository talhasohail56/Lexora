import { getCurrentUser } from "@/lib/auth";
import { getSubscriptionContext } from "@/lib/services/subscription-service";
import { ProfileSettingsClient } from "./profile-settings-client";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const subscription = await getSubscriptionContext(user.id, user.role);

  return (
    <ProfileSettingsClient
      initialProfile={{
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl,
        onboardingComplete: user.onboardingComplete,
        organization: user.organization,
        jurisdiction: user.jurisdiction,
        barNumber: user.barNumber,
        persona: user.persona,
        practiceArea: user.practiceArea,
        primaryUseCase: user.primaryUseCase,
        preferredTone: user.preferredTone,
        profileSummary: user.profileSummary,
      }}
      subscription={{
        planName: subscription.plan.name,
        status: subscription.status,
      }}
    />
  );
}
