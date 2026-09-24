import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSalonSession, handleApiError, ForbiddenError } from "@/lib/session-guard";

/**
 * GET here is specifically what "view details from notification" needs —
 * the notification stores an appointmentId, and clicking it should load
 * that one real appointment. Previously there was nothing for it to call:
 * the appointment existed in Postgres but the UI only ever looked at the
 * mock Context, which never had it.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSalonSession();
    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: { customer: true, staff: true, service: true, invoice: true },
    });
    if (!appointment || appointment.salonId !== session.salonId) {
      throw new ForbiddenError("Appointment not found for this salon");
    }
    return NextResponse.json(appointment);
  } catch (err) {
    return handleApiError(err);
  }
}

const patchSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  staffId: z.string().optional(),
  notes: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSalonSession(["OWNER", "RECEPTIONIST"]);
    const existing = await prisma.appointment.findUnique({ where: { id: params.id } });
    if (!existing || existing.salonId !== session.salonId) {
      throw new ForbiddenError("Appointment not found for this salon");
    }

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid update", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { status, date, time, staffId, notes } = parsed.data;

    // Rescheduling (date/time/staff changing) re-checks the same
    // double-booking guard the create route uses.
    if (date || time || staffId) {
      const nextDate = date ? new Date(`${date}T00:00:00`) : existing.date;
      const nextTime = time ?? existing.time;
      const nextStaffId = staffId ?? existing.staffId;
      const conflict = await prisma.appointment.findFirst({
        where: {
          salonId: session.salonId,
          staffId: nextStaffId,
          date: nextDate,
          time: nextTime,
          status: { not: "CANCELLED" },
          id: { not: existing.id },
        },
      });
      if (conflict) {
        return NextResponse.json({ error: "That slot is already booked" }, { status: 409 });
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        ...(status ? { status } : {}),
        ...(date ? { date: new Date(`${date}T00:00:00`) } : {}),
        ...(time ? { time } : {}),
        ...(staffId ? { staffId } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
      include: { customer: true, staff: true, service: true },
    });

    return NextResponse.json(appointment);
  } catch (err) {
    return handleApiError(err);
  }
}
