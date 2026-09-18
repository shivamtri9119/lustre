import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSalonSession, handleApiError } from "@/lib/session-guard";
import { hasConflict } from "@/lib/scheduling";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function GET(req: Request) {
  try {
    const { salonId } = await requireSalonSession();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    if (date && !dateRegex.test(date)) {
      return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
    }

    const appointments = await prisma.appointment.findMany({
      // Every query is scoped to the caller's OWN salon, taken from the
      // session — a salonId is never accepted from the request itself.
      // This is the tenant-isolation check that didn't exist anywhere
      // before.
      where: { salonId, ...(date ? { date: new Date(date) } : {}) },
      include: { customer: true, staff: true, service: true },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });

    return NextResponse.json(appointments);
  } catch (err) {
    return handleApiError(err);
  }
}

const createAppointmentSchema = z
  .object({
    customerId: z.string().min(1).optional(),
    newCustomer: z
      .object({ name: z.string().trim().min(1), phone: z.string().trim().min(5) })
      .optional(),
    staffId: z.string().min(1),
    serviceId: z.string().min(1),
    date: z.string().regex(dateRegex),
    time: z.string().regex(timeRegex),
    status: z.enum(["PENDING", "CONFIRMED"]).default("CONFIRMED"),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine((d) => Boolean(d.customerId ?? d.newCustomer), {
    message: "Provide either customerId or newCustomer",
    path: ["customerId"],
  });

export async function POST(req: Request) {
  try {
    const { salonId } = await requireSalonSession(["OWNER", "RECEPTIONIST", "STYLIST"]);
    const body = await req.json();
    const parsed = createAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid appointment", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const input = parsed.data;

    // Look up the service (and staff) server-side, scoped to this salon —
    // never trust a client-supplied price/duration, and this also stops
    // one salon from booking against another salon's staff/service IDs.
    const [service, staff] = await Promise.all([
      prisma.service.findFirst({ where: { id: input.serviceId, salonId } }),
      prisma.staff.findFirst({ where: { id: input.staffId, salonId } }),
    ]);
    if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });
    if (!staff) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

    // The actual conflict check. This is the exact overlap math that used
    // to live only in the public booking page's TimeStep component,
    // reading frozen mock data — now it's what gates every write, using
    // the salon's live appointments.
    const existing = await prisma.appointment.findMany({
      where: {
        salonId,
        staffId: input.staffId,
        date: new Date(input.date),
        status: { not: "CANCELLED" },
      },
      select: { id: true, time: true, durationMinutes: true },
    });
    if (hasConflict(input.time, service.durationMinutes, existing)) {
      return NextResponse.json(
        { error: `${staff.name} already has an appointment overlapping that time.` },
        { status: 409 }
      );
    }

    // "+ New customer" used to fabricate a name/id on the appointment only
    // — never a real Customer row, so it was invisible everywhere else in
    // the CRM. Now it actually creates one.
    const customerId = input.customerId
      ? (await prisma.customer.findFirst({ where: { id: input.customerId, salonId } }))?.id
      : (
          await prisma.customer.create({
            data: { salonId, name: input.newCustomer!.name, phone: input.newCustomer!.phone },
          })
        ).id;
    if (!customerId) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        salonId,
        customerId,
        staffId: input.staffId,
        serviceId: input.serviceId,
        date: new Date(input.date),
        time: input.time,
        durationMinutes: service.durationMinutes,
        price: service.price,
        status: input.status,
        notes: input.notes,
      },
      include: { customer: true, staff: true, service: true },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
