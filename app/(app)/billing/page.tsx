import { getSession } from "@/lib/auth";
import { getSubscriptionContext, listPlans } from "@/lib/services/subscription-service";
import { redirect } from "next/navigation";
import { BillingClient } from "./client";

export default async function BillingPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const [subscription, plans] = await Promise.all([
    getSubscriptionContext(session.userId, session.role),
    listPlans(),
  ]);

  return <BillingClient subscription={subscription} plans={plans} role={session.role} />;
}
