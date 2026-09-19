import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { startFreeTrial } from "@/lib/subscription";
import {
  ForbiddenError,
  handleApiError,
  RateLimitedError,
  UnauthorizedError,
} from "@/lib/session-guard";
import { rateLimit } from "@/lib/rate-limit";

const ONBOARD_LIMIT = 5;
const ONBOARD_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const schema = z.object({
  salonName: z.string().trim().min(2, "Salon name is too short").max(120),
});

class AlreadyOnboardedError extends Error {}

// Finishes a Google sign-up: creates the caller's salon, makes them its
// OWNER, and starts the free trial — all in one transaction, so a failure
// part-way never leaves a salon without an owner or a trial.
//
// Only a brand-new Google account may use this: the adapter creates those
// as CUSTOMER with no salon, staff or customer link. Everyone else (an
// existing owner, staff member or customer) is refused.
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new UnauthorizedError("Not signed in");
    const userId = session.user.id;

    const limit = rateLimit(`onboard:${userId}`, ONBOARD_LIMIT, ONBOARD_WINDOW_MS);
    if (!limit.allowed) {
      throw new RateLimitedError("Too many attempts. Please try again later.", limit.retryAfterSeconds);
    }

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid salon name" },
        { status: 400 }
      );
    }
    const { salonName } = parsed.data;

    try {
      await prisma.$transaction(async (tx) => {
        // Trust the database, not the token: the token may be stale.
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, role: true, salonId: true, staffId: true, customerId: true },
        });
        if (!user) throw new UnauthorizedError("Not signed in");
        if (user.salonId) throw new AlreadyOnboardedError();
        if (user.role !== "CUSTOMER" || user.staffId || user.customerId) {
          throw new ForbiddenError("This account can't create a salon");
        }

        const salon = await tx.salon.create({
          data: { name: salonName, address: "", phone: "", email: user.email },
        });

        // Claim the user only if it is still salon-less. If two requests race,
        // the loser matches zero rows and its whole transaction (including
        // the salon it just created) rolls back — one salon, one trial.
        const claimed = await tx.user.updateMany({
          where: { id: user.id, salonId: null },
          data: { role: "OWNER", salonId: salon.id },
        });
        if (claimed.count !== 1) throw new AlreadyOnboardedError();

        await startFreeTrial(tx, salon.id);
      });
    } catch (err) {
      // Double-click or a second tab: the first request already did the work.
      if (err instanceof AlreadyOnboardedError) {
        return NextResponse.json({ ok: true });
      }
      throw err;
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
