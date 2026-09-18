import { PrismaClient } from "@prisma/client";

// Standard Next.js + Prisma singleton. In dev, Next's hot-reload re-executes
// this module on every edit; without stashing the client on `globalThis` each
// reload would open a fresh DB connection pool and eventually exhaust
// Postgres's max_connections. In production there's one instance anyway.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
