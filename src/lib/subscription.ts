import { prisma } from "@/lib/prisma";

export const PLAN_PRICING = {
  MONTHLY: { amountInr: 499, label: "₹499 / month" },
  YEARLY: { amountInr: 4999, label: "₹4,999 / year" },
} as const;

export interface SubscriptionState {
  active: boolean;
  plan: "MONTHLY" | "YEARLY" | null;
  currentPeriodEnd: Date | null;
}

/**
 * A salon's access is gated on ONE subscription per salon (not per staff
 * login) — the owner pays once and the whole team gets access. "Active"
 * means a row exists, its status is ACTIVE, and its period hasn't lapsed;
 * a payment that was never completed simply never created this row, so
 * the default for a brand-new salon is correctly "not active".
 */
export async function getSubscriptionState(salonId: string): Promise<SubscriptionState> {
  const sub = await prisma.subscription.findUnique({ where: { salonId } });
  if (!sub) return { active: false, plan: null, currentPeriodEnd: null };

  const active = sub.status === "ACTIVE" && sub.currentPeriodEnd > new Date();
  return { active, plan: sub.plan, currentPeriodEnd: sub.currentPeriodEnd };
}
