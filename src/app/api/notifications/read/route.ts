import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSalonSession, handleApiError } from "@/lib/session-guard";

export async function POST() {
  try {
    const session = await requireSalonSession();

    await prisma.notification.updateMany({
      where: { salonId: session.salonId, channel: "IN_APP", readAt: null },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
