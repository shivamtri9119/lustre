import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { handleApiError, RateLimitedError } from "@/lib/session-guard";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { hashResetToken } from "@/lib/tokens";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Rate limit by IP only here (not by token — a token is single-use and
// short-lived already; the risk this guards against is someone scripting
// guesses across many random token values).
const IP_LIMIT = 20;
const IP_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const GENERIC_INVALID = "This reset link is invalid or has expired. Request a new one.";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (!rateLimit(`reset-password-ip:${ip}`, IP_LIMIT, IP_WINDOW_MS).allowed) {
      throw new RateLimitedError("Too many attempts. Please try again later.", 60);
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors.password?.[0] ?? "Invalid request" },
        { status: 400 }
      );
    }
    const { token, password } = parsed.data;

    const tokenHash = hashResetToken(token);
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      // Same generic message for "doesn't exist", "already used", and
      // "expired" — no reason to help an attacker distinguish which.
      return NextResponse.json({ error: GENERIC_INVALID }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate any other outstanding reset tokens for this user so an
      // older, still-unused link can't be used after this one succeeds.
      prisma.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null, id: { not: record.id } },
        data: { usedAt: new Date() },
      }),
    ]);

    // NOTE (documented limitation, not overlooked): sessions here are
    // stateless JWTs (see auth.ts), so an existing signed-in session for
    // this user on another device isn't force-invalidated by this reset —
    // it will simply expire on its own normal schedule. Closing that gap
    // would mean checking a per-user token version against the DB on every
    // request, which trades away the "hydrate the JWT once" performance
    // choice already made deliberately in auth.ts. Flagging it here rather
    // than silently shipping partial session revocation.
    return NextResponse.json({ message: "Password updated. You can now log in." });
  } catch (err) {
    return handleApiError(err);
  }
}
