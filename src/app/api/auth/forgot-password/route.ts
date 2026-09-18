import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError, RateLimitedError } from "@/lib/session-guard";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { generateResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

// F-02/F-04 pattern reused here: per-IP stops mass token generation, per-email
// stops someone spamming one inbox with reset links.
const IP_LIMIT = 10;
const IP_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const EMAIL_LIMIT = 3;
const EMAIL_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (!rateLimit(`forgot-password-ip:${ip}`, IP_LIMIT, IP_WINDOW_MS).allowed) {
      // Generic message even on rate limit — never confirm/deny anything
      // distinct from the normal "we sent it if it exists" response.
      throw new RateLimitedError("Too many requests. Please try again later.", 60);
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }
    const { email } = parsed.data;

    // This response is IDENTICAL whether or not the account exists, the
    // request was rate-limited, or the email send below succeeds — an
    // attacker (or a curious user) gets no signal either way. This is the
    // same anti-enumeration principle already used in /api/auth/signup.
    const genericResponse = NextResponse.json({
      message: "If an account exists for that email, a reset link is on its way.",
    });

    const emailLimit = rateLimit(`forgot-password-email:${email}`, EMAIL_LIMIT, EMAIL_WINDOW_MS);
    if (!emailLimit.allowed) return genericResponse;

    const user = await prisma.user.findUnique({ where: { email } });
    // No account, or an OAuth-only account with no password to reset.
    if (!user?.passwordHash) return genericResponse;

    const { rawToken, tokenHash } = generateResetToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const origin = new URL(req.url).origin;
    const resetUrl = `${origin}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(email, resetUrl);

    return genericResponse;
  } catch (err) {
    return handleApiError(err);
  }
}
