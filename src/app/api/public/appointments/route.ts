import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError, RateLimitedError } from "@/lib/session-guard";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getPublicSalon } from "@/lib/public-salon";
import { hasConflict } from "@/lib/scheduling";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_DAYS_AHEAD = 90;

// F-05 from the security audit, called out explicitly so this endpoint is
// never "simplified" back into the staff one:
//
//   "the eventual public endpoint isn't accidentally built by loosening
//    the staff endpoint's role check — it needs its own public,
//    rate-limited, more tightly validated endpoint (no status override to
//    CONFIRMED, no ability to book on behalf of arbitrary customerId, slot
//    availability re-checked server-side)."
//
// Everything below exists to satisfy that: status is hard-coded to
// PENDING (never accepted from the request), there is no customerId field
// in the schema at all (a new Customer row is always created — see the
// note below), and the conflict check re-runs against live data
// server-side rather than trusting whatever slot the client last saw.
const bookingSchema = z.object({
  serviceId: z.string().min(1),
  staffId: z.string().min(1),
  date: z.string().regex(dateRegex),
  time: z.string().regex(timeRegex),
  customerName: z.string().trim().min(1).max(120),
  customerPhone: z.string().trim().min(5).max(20),
  notes: z.string().trim().max(500).optional(),
});

const IP_LIMIT = 5;
const IP_WINDOW_MS = 60 * 60 * 1000; // 1 hour — generous for a real customer, tight for a script

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (!rateLimit(`public-booking-ip:${ip}`, IP_LIMIT, IP_WINDOW_MS).allowed) {
      throw new RateLimitedError("Too many booking attempts. Please try again later, or call us.", 60);
    }

    const body = await req.json();
    const parsed = bookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid booking details", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const input = parsed.data;

    const requestedDate = new Date(`${input.date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + MAX_DAYS_AHEAD);
    if (requestedDate < today || requestedDate > maxDate) {
      return NextResponse.json(
        { error: `Date must be within the next ${MAX_DAYS_AHEAD} days` },
        { status: 400 }
      );
    }

    const salon = await getPublicSalon();
    if (!salon) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Re-verify service and staff belong to THIS salon, and that this
    // staff member is actually assigned to this service — the client's
    // earlier step selections are not trusted, exactly like the staff
    // endpoint's own server-side re-lookup.
    const [service, staff] = await Promise.all([
      prisma.service.findFirst({ where: { id: input.serviceId, salonId: salon.id } }),
      prisma.staff.findFirst({
        where: {
          id: input.staffId,
          salonId: salon.id,
          status: "ACTIVE",
          services: { some: { serviceId: input.serviceId } },
        },
      }),
    ]);
    if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });
    if (!staff) return NextResponse.json({ error: "Stylist not available for this service" }, { status: 404 });

    const existing = await prisma.appointment.findMany({
      where: {
        salonId: salon.id,
        staffId: input.staffId,
        date: requestedDate,
        status: { not: "CANCELLED" },
      },
      select: { id: true, time: true, durationMinutes: true },
    });
    if (hasConflict(input.time, service.durationMinutes, existing)) {
      return NextResponse.json(
        { error: "That slot was just taken. Please pick another time." },
        { status: 409 }
      );
    }

    // Deliberately always creates a new Customer row rather than accepting
    // a customerId or matching an existing one by phone: this is an
    // unauthenticated endpoint, so trusting either would let a stranger
    // attach bookings to (or, via customerId, directly write appointments
    // against) someone else's existing customer record. The trade-off is
    // duplicate customer rows for repeat public bookers — a data-quality
    // issue to solve later (e.g. once the public portal has real customer
    // accounts to match against), not a security one to solve by loosening
    // this.
    const customer = await prisma.customer.create({
      data: { salonId: salon.id, name: input.customerName, phone: input.customerPhone },
    });

    const appointment = await prisma.appointment.create({
      data: {
        salonId: salon.id,
        customerId: customer.id,
        staffId: input.staffId,
        serviceId: input.serviceId,
        date: requestedDate,
        time: input.time,
        durationMinutes: service.durationMinutes,
        price: service.price,
        // Hard-coded, never taken from the request — a public booking
        // starts PENDING and a staff member confirms it, the same way a
        // walk-in would be handled at the front desk.
        status: "PENDING",
        notes: input.notes,
      },
      include: { service: true, staff: true },
    });

    return NextResponse.json(
      {
        reference: appointment.id,
        service: appointment.service.name,
        staff: appointment.staff.name,
        date: input.date,
        time: input.time,
        price: Number(appointment.price),
      },
      { status: 201 }
    );
  } catch (err) {
    return handleApiError(err);
  }
}
