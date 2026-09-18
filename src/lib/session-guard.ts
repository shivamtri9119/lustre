import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { auth } from "@/auth";
import { getSubscriptionState } from "@/lib/subscription";

/**
 * This file — called at the top of every /api route — is the actual
 * multi-tenant security boundary, not proxy.ts.
 *
 * Next.js 16 moved middleware to proxy.ts and narrowed its job to routing
 * (redirects/rewrites/headers). That's not just a style preference: relying
 * on a routing-layer gate as your only auth check was exactly the shape of
 * CVE-2025-29927 (a middleware-based auth bypass). So proxy.ts here only
 * does a cheap "no session cookie at all → bounce to /login" redirect for
 * UX. Every route re-verifies the real session AND checks that the
 * resource's salonId matches the caller's salonId — that second check is
 * the actual tenant-isolation mechanism this app didn't have at all before.
 */

export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}

export class RateLimitedError extends Error {
  constructor(message: string, public retryAfterSeconds: number) {
    super(message);
  }
}

export interface SalonSession {
  userId: string;
  role: Role;
  salonId: string;
}

/**
 * Resolves the caller's session and confirms it's linked to a salon.
 * Pass `allowedRoles` to additionally restrict by role (e.g. only
 * OWNER/RECEPTIONIST can create invoices). Throws — callers should route
 * through `handleApiError` in a catch block, or use `withSalonSession`.
 *
 * Also enforces the paid-access gate: this is the API-level counterpart to
 * the check in (dashboard)/layout.tsx. That layout check alone would only
 * stop a lapsed salon from *loading the dashboard page* — a session cookie
 * issued before the subscription expired could still hit these routes
 * directly. Pass `skipSubscriptionCheck: true` only from the billing routes
 * that create/verify a payment, since those must work precisely when the
 * subscription is NOT active yet.
 */
export async function requireSalonSession(
  allowedRoles?: Role[],
  options?: { skipSubscriptionCheck?: boolean }
): Promise<SalonSession> {
  const session = await auth();
  if (!session?.user) {
    throw new UnauthorizedError("Not signed in");
  }
  if (!session.user.salonId) {
    // e.g. a brand-new Google sign-in that hasn't completed salon onboarding
    throw new ForbiddenError("This account isn't linked to a salon yet");
  }
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    throw new ForbiddenError(`Role ${session.user.role} cannot perform this action`);
  }
  if (!options?.skipSubscriptionCheck) {
    const subscription = await getSubscriptionState(session.user.salonId);
    if (!subscription.active) {
      throw new ForbiddenError("This salon's subscription is inactive. Ask the owner to renew.");
    }
  }
  return {
    userId: session.user.id,
    role: session.user.role,
    salonId: session.user.salonId,
  };
}

/** Maps the errors above (and zod's) to the right HTTP status + JSON body. */
export function handleApiError(err: unknown): NextResponse {
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
  if (err instanceof ForbiddenError) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
  if (err instanceof RateLimitedError) {
    return NextResponse.json(
      { error: err.message },
      { status: 429, headers: { "Retry-After": String(err.retryAfterSeconds) } }
    );
  }
  if (err && typeof err === "object" && "issues" in err) {
    // zod SafeParseError-shaped
    return NextResponse.json({ error: "Invalid request body", details: err }, { status: 400 });
  }
  console.error("Unhandled API error:", err);
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}
