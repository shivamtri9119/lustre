import { prisma } from "@/lib/prisma";

export const PLAN_PRICING = {
  MONTHLY: { amountInr: 499, label: "₹499 / month" },
  YEARLY: { amountInr: 4999, label: "₹4,999 / year" },
} as const;

// A salon with a lapsed subscription (or one that never subscribed at all)
// gets deleted this many days after the lapse/signup, to keep the free
// database tier from filling up with abandoned accounts. Used by both the
// warning shown on /subscribe (so an owner isn't surprised) and the actual
// deletion job at /api/cron/cleanup-inactive-salons — one number, so the
// warning can never drift out of sync with what actually happens.
export const INACTIVITY_DELETION_DAYS = 90;

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
