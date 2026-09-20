import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { generateUniqueSlug } from "@/lib/slug";
import { prisma } from "@/lib/prisma";
import { handleApiError, RateLimitedError } from "@/lib/session-guard";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// F-02 (security audit): unauthenticated signup abuse resistance.
// Per-IP: stops one client from mass-creating salons/accounts.
// Per-email: stops repeated signup attempts against one address (which
// would otherwise let an attacker use response timing/behavior to probe
// for existing accounts faster than the vague 409 message alone prevents).
const SIGNUP_IP_LIMIT = 5;
const SIGNUP_IP_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const SIGNUP_EMAIL_LIMIT = 3;
const SIGNUP_EMAIL_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const signupSchema = z.object({
  salonName: z.string().trim().min(2, "Salon name is too short").max(120),
  ownerName: z.string().trim().min(2, "Name is too short").max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Creates a brand-new Salon + its first User (role OWNER) in one
// transaction. This is the real implementation the old signup/page.tsx
// comment pointed at ("POST /api/auth/signup") but never had.
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const ipCheck = rateLimit(`signup-ip:${ip}`, SIGNUP_IP_LIMIT, SIGNUP_IP_WINDOW_MS);
    if (!ipCheck.allowed) {
      throw new RateLimitedError("Too many signup attempts. Please try again later.", ipCheck.retryAfterSeconds);
    }

    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid signup details", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { salonName, ownerName, email, password } = parsed.data;

    const emailCheck = rateLimit(`signup-email:${email}`, SIGNUP_EMAIL_LIMIT, SIGNUP_EMAIL_WINDOW_MS);
    if (!emailCheck.allowed) {
      // Same vague-on-purpose framing as the existing-account response below —
      // don't give an attacker a distinct signal for "this email is rate limited"
      // vs. "this email already has an account".
      throw new RateLimitedError("Couldn't create that account. Try logging in instead.", emailCheck.retryAfterSeconds);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Deliberately vague — don't confirm/deny which emails have accounts.
      return NextResponse.json(
        { error: "Couldn't create that account. Try logging in instead." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const slug = await generateUniqueSlug(tx, salonName);
      const salon = await tx.salon.create({
        data: {
          name: salonName,
          slug,
          address: "",
          phone: "",
          email,
        },
      });
      return tx.user.create({
        data: {
          name: ownerName,
          email,
          passwordHash,
          role: "OWNER",
          salonId: salon.id,
        },
      });
    });

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
