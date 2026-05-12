import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { findAvailablePlan, switchPlan } from "@/lib/services/subscription-service";

const Payment = z.object({
  cardholderName: z.string().min(2).max(120),
  cardNumber: z.string().min(12).max(24),
  expiry: z.string().min(4).max(7),
  cvc: z.string().min(3).max(4),
});

const Body = z.object({
  planCode: z.string().min(2).max(40),
  payment: Payment.optional(),
});

function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

function validatePayment(input: z.infer<typeof Payment>) {
  const cardNumber = normalizeDigits(input.cardNumber);
  const cvc = normalizeDigits(input.cvc);
  const expiry = input.expiry.trim();
  if (cardNumber.length < 12 || cardNumber.length > 19) throw new Error("Enter a valid card number");
  if (!/^(0[1-9]|1[0-2])\s*\/?\s*\d{2,4}$/.test(expiry)) throw new Error("Enter expiry as MM/YY");
  if (cvc.length < 3 || cvc.length > 4) throw new Error("Enter a valid CVC");
  return { last4: cardNumber.slice(-4) };
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { planCode, payment } = Body.parse(await req.json());
    const plan = await findAvailablePlan(session.role, planCode);
    if (!plan) throw new Error("Plan not available for this role");

    const paidPlan = plan.priceCents > 0;
    if (paidPlan && !payment) throw new Error("Card details are required for paid plans");
    const paymentMeta = paidPlan ? validatePayment(payment!) : null;
    const subscription = await switchPlan(session.userId, session.role, planCode, session.userId, {
      provider: paidPlan ? "CARD_SIMULATION" : "MANUAL",
      paymentLast4: paymentMeta?.last4,
      plan,
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      planName: subscription.plan.name,
      provider: paidPlan ? "CARD_SIMULATION" : "MANUAL",
      paymentLast4: paymentMeta?.last4,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
