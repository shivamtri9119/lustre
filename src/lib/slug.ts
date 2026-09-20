import type { Prisma } from "@prisma/client";

// A salon's public booking page lives at /book/<slug>. The slug is generated
// from the salon name at sign-up and the owner can change it later.

export const SLUG_MIN = 3;
export const SLUG_MAX = 40;

// Words that would make a confusing (or, next to the app's own routes,
// misleading) booking link.
const RESERVED = new Set([
  "admin", "api", "app", "billing", "book", "dashboard", "help", "login",
  "logout", "lustre", "onboarding", "settings", "signup", "subscribe",
  "support", "www",
]);

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents: "Café" -> "Cafe"
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
}

/** Returns a human-readable problem with the slug, or null if it's fine. */
export function validateSlug(slug: string): string | null {
  if (slug.length < SLUG_MIN) return `Use at least ${SLUG_MIN} characters.`;
  if (slug.length > SLUG_MAX) return `Use at most ${SLUG_MAX} characters.`;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return "Use only lowercase letters, numbers and single hyphens (no hyphen at the start or end).";
  }
  if (RESERVED.has(slug)) return "That name is reserved. Please pick another.";
  return null;
}

/**
 * Picks a free slug for a salon name: "Glow Studio" -> "glow-studio", then
 * "glow-studio-2", "glow-studio-3", ... if that's taken. Takes a client so
 * it can run inside the caller's transaction.
 *
 * The check-then-insert is not atomic on its own; the unique index on
 * salons.slug is what actually guarantees uniqueness.
 */
export async function generateUniqueSlug(
  db: Prisma.TransactionClient,
  name: string
): Promise<string> {
  let base = slugify(name);
  if (!base) base = "salon";
  if (base.length < SLUG_MIN || RESERVED.has(base)) base = `${base}-salon`;
  // Leave room for a "-NN" suffix inside SLUG_MAX.
  base = base.slice(0, SLUG_MAX - 4).replace(/-+$/g, "");

  for (let n = 1; n <= 30; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const taken = await db.salon.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  // 30 salons with the same name: fall back to a random suffix.
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Salons created before slugs existed have none. This gives them one the
 * first time it's needed (when the owner opens the dashboard) and returns
 * it. Safe to call repeatedly and concurrently.
 */
export async function ensureSalonSlug(
  db: Prisma.TransactionClient,
  salonId: string
): Promise<string> {
  const salon = await db.salon.findUnique({
    where: { id: salonId },
    select: { slug: true, name: true },
  });
  if (!salon) throw new Error("Salon not found");
  if (salon.slug) return salon.slug;

  const candidate = await generateUniqueSlug(db, salon.name);
  // Only fills the slug if it is still empty, so two requests racing here
  // can't overwrite each other.
  const res = await db.salon.updateMany({
    where: { id: salonId, slug: null },
    data: { slug: candidate },
  });
  if (res.count === 1) return candidate;

  const again = await db.salon.findUnique({
    where: { id: salonId },
    select: { slug: true },
  });
  return again?.slug ?? candidate;
}
