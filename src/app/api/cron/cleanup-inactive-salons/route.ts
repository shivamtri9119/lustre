import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { INACTIVITY_DELETION_DAYS } from "@/lib/subscription";

export async function POST(req: Request) {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured — refusing to run a destructive job unprotected." },
      { status: 503 }
    );
  }

  const providedSecret = req.headers.get("x-cron-secret") ?? "";
  const configuredBuf = Buffer.from(configuredSecret);
  const providedBuf = Buffer.from(providedSecret);
  const valid =
    configuredBuf.length === providedBuf.length && timingSafeEqual(configuredBuf, providedBuf);
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - INACTIVITY_DELETION_DAYS);

  const [lapsed, neverSubscribed] = await Promise.all([
    prisma.salon.findMany({
      where: { subscription: { currentPeriodEnd: { lt: cutoff } } },
      select: { id: true, name: true },
    }),
    prisma.salon.findMany({
      where: { subscription: null, createdAt: { lt: cutoff } },
      select: { id: true, name: true },
    }),
  ]);

  const toDelete = [...lapsed, ...neverSubscribed];

  if (toDelete.length > 0) {
    await prisma.salon.deleteMany({ where: { id: { in: toDelete.map((s) => s.id) } } });
  }

  return NextResponse.json({
    deletedCount: toDelete.length,
    deletedSalonIds: toDelete.map((s) => s.id),
    cutoffDate: cutoff.toISOString(),
  });
}
