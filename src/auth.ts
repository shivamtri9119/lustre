import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit, rateLimitReset } from "@/lib/rate-limit";

// F-02 (security audit): brute-force resistance on the Credentials
// provider. Per-email is the primary control (stops targeted guessing
// against one account regardless of source IP); per-IP is a looser
// secondary control (stops one client spraying many accounts). Both are
// checked before the bcrypt compare so a lockout also saves the (modest)
// cost of that hash. See src/lib/rate-limit.ts for the single-instance
// caveat — this needs a shared store before a multi-instance deploy.
const LOGIN_EMAIL_LIMIT = 5;
const LOGIN_EMAIL_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_IP_LIMIT = 20;
const LOGIN_IP_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Database sessions don't support the Credentials provider (Auth.js
  // requirement) — JWT is the only valid strategy once Credentials is in
  // the provider list, so both providers below share this one.
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw, request) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        // Deliberately return null (the same generic outcome as "wrong
        // password") rather than a distinct error — an attacker shouldn't
        // be able to tell "rate limited" apart from "wrong credentials".
        const ip = getClientIp(request);
        const emailKey = `login:${email}`;
        if (!rateLimit(emailKey, LOGIN_EMAIL_LIMIT, LOGIN_EMAIL_WINDOW_MS).allowed) return null;
        if (!rateLimit(`login-ip:${ip}`, LOGIN_IP_LIMIT, LOGIN_IP_WINDOW_MS).allowed) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { salon: { select: { name: true } } },
        });
        // No account, or a Google-only account with no password set.
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        // Successful login — clear this account's failed-attempt counter
        // so a legitimate user who mistyped a few times isn't left
        // artificially throttled after they get it right.
        rateLimitReset(emailKey);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          salonId: user.salonId,
          salonName: user.salon?.name ?? null,
          staffId: user.staffId,
          customerId: user.customerId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Fresh sign-in via Credentials — `user` is exactly what
        // `authorize` returned above.
        token.role = user.role;
        token.salonId = user.salonId;
        token.salonName = user.salonName ?? null;
        token.staffId = user.staffId ?? null;
        token.customerId = user.customerId ?? null;
      } else if (token.email && token.role === undefined) {
        // Fresh sign-in via Google: the adapter already wrote the User row
        // (see schema.prisma's User.role @default(CUSTOMER) note) before
        // this callback runs. Hydrate the token from it once; every later
        // request reuses the token without hitting the DB again.
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          include: { salon: { select: { name: true } } },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.salonId = dbUser.salonId;
          token.salonName = dbUser.salon?.name ?? null;
          token.staffId = dbUser.staffId;
          token.customerId = dbUser.customerId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role;
        session.user.salonId = token.salonId;
        session.user.salonName = token.salonName ?? null;
        session.user.staffId = token.staffId ?? null;
        session.user.customerId = token.customerId ?? null;
      }
      return session;
    },
  },
});
