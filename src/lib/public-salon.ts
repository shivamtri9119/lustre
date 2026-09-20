import { prisma } from "@/lib/prisma";
import { getSubscriptionState } from "@/lib/subscription";

/**
 * The public booking portal (/book/<slug> and its API routes) has no login,
 * so the salon is identified by the slug in the URL. Every public route goes
 * through one of these two functions, so a visitor can only ever reach the
 * salon whose link they were given.
 */

export function normalizeSlug(raw: string | null | undefined): string {
  return (raw ?? "").trim().toLowerCase();
}

/** The salon for a slug, whatever its subscription state. Null if unknown. */
export async function findSalonBySlug(raw: string | null | undefined) {
  const slug = normalizeSlug(raw);
  if (!slug || slug.length > 60) return null;
  return prisma.salon.findUnique({ where: { slug } });
}

/**
 * The salon for a slug only if it is currently allowed to take online
 * bookings — i.e. its trial or subscription is active. Bookings for a salon
 * that can't log in would land where nobody can see them, so the public API
 * refuses them instead.
 */
export async function getPublicSalon(raw: string | null | undefined) {
  const salon = await findSalonBySlug(raw);
  if (!salon) return null;
  const { active } = await getSubscriptionState(salon.id);
  return active ? salon : null;
}
