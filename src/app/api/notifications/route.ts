import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSalonSession, handleApiError } from "@/lib/session-guard";

const LIMIT = 20;

export async function GET() {
  try {
    const session = await requireSalonSession();

    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { salonId: session.salonId, channel: "IN_APP" },
        orderBy: { createdAt: "desc" },
        take: LIMIT,
      }),
      prisma.notification.count({
        where: { salonId: session.salonId, channel: "IN_APP", readAt: null },
      }),
    ]);

    return NextResponse.json({
      unreadCount,
      items: items.map((n) => ({
        id: n.id,
        event: n.event,
        payload: n.payload,
        read: n.readAt !== null,
        createdAt: n.createdAt,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
