import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSalonSession, handleApiError } from "@/lib/session-guard";
import { hasConflict } from "@/lib/scheduling";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const patchSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
  date: z.string().regex(dateRegex).optional(),
  time: z.string().regex(timeRegex).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { salonId } = await requireSalonSession(["OWNER", "RECEPTIONIST", "STYLIST"]);
    const { id } = await params;

    // Scoped by salonId here too — requesting another salon's appointment
    // ID 404s instead of leaking whether it exists.
    const appointment = await prisma.appointment.findFirst({ where: { id, salonId } });
    if (!appointment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid update", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const input = parsed.data;
    const isReschedule = input.date !== undefined || input.time !== undefined;
    const nextDate = input.date ?? appointment.date.toISOString().slice(0, 10);
    const nextTime = input.time ?? appointment.time;

    if (isReschedule) {
      // The old reschedule-dialog.tsx -> reschedule() had zero conflict
      // check at all. This is that check, applied to the new slot, with
      // the appointment excluded from conflicting with its own old slot.
      const existing = await prisma.appointment.findMany({
        where: {
          salonId,
          staffId: appointment.staffId,
          date: new Date(nextDate),
          status: { not: "CANCELLED" },
        },
        select: { id: true, time: true, durationMinutes: true },
      });
      if (hasConflict(nextTime, appointment.durationMinutes, existing, appointment.id)) {
        return NextResponse.json(
          { error: "That staff member already has an appointment overlapping the new time." },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        ...(input.status ? { status: input.status } : {}),
        ...(isReschedule ? { date: new Date(nextDate), time: nextTime } : {}),
      },
      include: { customer: true, staff: true, service: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
