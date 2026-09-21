import type { Prisma } from "@prisma/client";
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

// Free trial given to every salon created through Google sign-up.
export const TRIAL_DAYS = 30;

export interface SubscriptionState {
  active: boolean;
  plan: "MONTHLY" | "YEARLY" | null;
  currentPeriodEnd: Date | null;
  // True while on (or, once lapsed, after) the free trial and no payment has
  // been made since.
  trial: boolean;
}

/**
 * Starts the free trial for a brand-new salon. Takes the caller's
 * transaction client so the salon, its owner and the trial are created
 * together or not at all. The salonId column is unique, so a salon can never
 * get a second trial row.
 */
export function startFreeTrial(tx: Prisma.TransactionClient, salonId: string) {
  const currentPeriodEnd = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  return tx.subscription.create({
    data: { salonId, plan: "MONTHLY", status: "ACTIVE", isTrial: true, currentPeriodEnd },
  });
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
  if (!sub) return { active: false, plan: null, currentPeriodEnd: null, trial: false };

  const active = sub.status === "ACTIVE" && sub.currentPeriodEnd > new Date();
  return { active, plan: sub.plan, currentPeriodEnd: sub.currentPeriodEnd, trial: sub.isTrial };
}
