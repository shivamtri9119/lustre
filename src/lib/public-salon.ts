import { prisma } from "@/lib/prisma";

/**
 * The public booking portal (/book and its API routes) doesn't have a
 * session to read a salonId from, and there's currently no per-salon slug
 * or subdomain in the URL — this app is single-salon-per-deployment today
 * (see README's "Multi-tenant onboarding" roadmap item). So for now this
 * just resolves the one Salon row that exists.
 *
 * TODO when multi-tenant onboarding ships: change this to resolve by a
 * slug/subdomain taken from the request instead of "the first salon" —
 * every public route below already takes its salonId from this one
 * function, so that's the only place that needs to change.
 */
export async function getPublicSalon() {
  return prisma.salon.findFirst({ orderBy: { createdAt: "asc" } });
}
