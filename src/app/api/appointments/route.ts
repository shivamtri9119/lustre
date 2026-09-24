import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSalonSession, handleApiError } from "@/lib/session-guard";

/**
 * This is the route the dashboard's Appointments section was missing.
 * Until now, that screen rendered from src/lib/appointments-store.tsx's
 * mock Context, which only holds state created *in that browser tab*.
 * Appointments created through the real public booking flow
 * (/api/public/appointments) were written to Postgres but this screen
 * never fetched them — hence "booked appointment not showing up".
 */

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const listQuerySchema = z.object({
  date: z.string().regex(dateRegex).optional(),
  staffId: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await requireSalonSession();
    const { searchParams } = new URL(req.url);
    const parsed = listQuerySchema.safeParse({
      date: searchParams.get("date") ?? undefined,
      staffId: searchParams.get("staffId") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query params" }, { status: 400 });
    }
    const { date, staffId } = parsed.data;

    const appointments = await prisma.appointment.findMany({
      where: {
        salonId: session.salonId,
        ...(date ? { date: new Date(`${date}T00:00:00`) } : {}),
        ...(staffId ? { staffId } : {}),
      },
      include: { customer: true, staff: true, service: true },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });

    return NextResponse.json(appointments);
  } catch (err) {
    return handleApiError(err);
  }
}

const createSchema = z.object({
  customerId: z.string().min(1),
  staffId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().regex(dateRegex),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSalonSession(["OWNER", "RECEPTIONIST"]);
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid appointment data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { customerId, staffId, serviceId, date, time, notes } = parsed.data;

    const [customer, staff, service] = await Promise.all([
      prisma.customer.findFirst({ where: { id: customerId, salonId: session.salonId } }),
      prisma.staff.findFirst({ where: { id: staffId, salonId: session.salonId } }),
      prisma.service.findFirst({ where: { id: serviceId, salonId: session.salonId } }),
    ]);
    if (!customer || !staff || !service) {
      return NextResponse.json({ error: "Customer, staff, or service not found" }, { status: 404 });
    }

    // Same double-booking guard as the public booking route (F-05) — a
    // staff member can't be booked twice for an overlapping slot.
    const requestedDate = new Date(`${date}T00:00:00`);
    const conflict = await prisma.appointment.findFirst({
      where: {
        salonId: session.salonId,
        staffId,
        date: requestedDate,
        time,
        status: { not: "CANCELLED" },
      },
    });
    if (conflict) {
      return NextResponse.json({ error: "That slot is already booked" }, { status: 409 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        salonId: session.salonId,
        customerId,
        staffId,
        serviceId,
        date: requestedDate,
        time,
        durationMinutes: service.durationMinutes,
        price: service.price,
        notes,
      },
      include: { customer: true, staff: true, service: true },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
