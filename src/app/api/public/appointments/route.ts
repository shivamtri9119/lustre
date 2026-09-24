import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/session-guard";
import { getPublicSalon } from "@/lib/public-salon";
import { hasConflict, isWithinWorkingHours } from "@/lib/scheduling";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// The write side of the public booking flow — no login, so the salon is
// identified purely by the slug in the request body (see getPublicSalon),
// exactly like the public GET routes (services/staff/availability) already
// are. This file previously got overwritten with a copy of the staff-only
// POST /api/appointments handler (which requires a session and a different
// request shape entirely) — that's why the booking page was returning
// "Invalid appointment": the two request shapes don't match, and a real
// customer has no session to satisfy requireSalonSession in the first
// place. Rebuilt to match what BookingPortal (src/components/booking/
// booking-portal.tsx) actually sends.

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const bookingSchema = z.object({
  // Which salon's booking page this came from (the slug in /book/<slug>).
  salonSlug: z.string().trim().min(1).max(60),
  serviceId: z.string().min(1),
  staffId: z.string().min(1),
  date: z.string().regex(dateRegex),
  time: z.string().regex(timeRegex),
  customerName: z.string().trim().min(1).max(120),
  customerPhone: z.string().trim().min(5).max(20),
});

export async function POST(req: Request) {
  // A public, unauthenticated form is the easiest thing on the whole site
  // to hammer — limit by IP, generously enough that a real customer
  // retrying a mistyped phone number never hits it.
  const limit = rateLimit(`public-booking:${getClientIp(req)}`, 20, 10 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }

  try {
    const parsed = bookingSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid booking details", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const input = parsed.data;

    // Only a salon whose trial/subscription is currently active can be
    // found this way — see getPublicSalon. A lapsed salon's link 404s
    // rather than silently accepting bookings nobody can see.
    const salon = await getPublicSalon(input.salonSlug);
    if (!salon) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Looked up server-side, scoped to this salon — the client only ever
    // sends ids, never a price or duration we'd have to trust.
    const [service, staff] = await Promise.all([
      prisma.service.findFirst({ where: { id: input.serviceId, salonId: salon.id } }),
      prisma.staff.findFirst({
        where: { id: input.staffId, salonId: salon.id, status: "ACTIVE", services: { some: { serviceId: input.serviceId } } },
      }),
    ]);
    if (!service || !staff) {
      return NextResponse.json({ error: "Service or stylist not found" }, { status: 404 });
    }

    const requestedDate = new Date(`${input.date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (requestedDate < today) {
      return NextResponse.json({ error: "Date is in the past" }, { status: 400 });
    }

    // Enforced here, not just by which slots the availability endpoint
    // offered: a forged request for a time outside the stylist's hours
    // must fail even though the booking page would never have shown it.
    if (!isWithinWorkingHours(input.time, service.durationMinutes, staff.workStartMinutes, staff.workEndMinutes)) {
      return NextResponse.json(
        { error: `${staff.name} isn't working at that time. Please pick another slot.` },
        { status: 409 }
      );
    }

    const existing = await prisma.appointment.findMany({
      where: { salonId: salon.id, staffId: input.staffId, date: requestedDate, status: { not: "CANCELLED" } },
      select: { id: true, time: true, durationMinutes: true },
    });
    if (hasConflict(input.time, service.durationMinutes, existing)) {
      return NextResponse.json(
        { error: `${staff.name} already has an appointment overlapping that time.` },
        { status: 409 }
      );
    }

    // Match an existing customer by phone for this salon before creating a
    // new one, so a returning customer doesn't get a duplicate row every
    // time they book online.
    const existingCustomer = await prisma.customer.findFirst({
      where: { salonId: salon.id, phone: input.customerPhone },
      select: { id: true },
    });
    const customerId =
      existingCustomer?.id ??
      (
        await prisma.customer.create({
          data: { salonId: salon.id, name: input.customerName, phone: input.customerPhone },
        })
      ).id;

    const appointment = await prisma.appointment.create({
      data: {
        salonId: salon.id,
        customerId,
        staffId: input.staffId,
        serviceId: input.serviceId,
        date: requestedDate,
        time: input.time,
        durationMinutes: service.durationMinutes,
        price: service.price,
        status: "PENDING",
      },
    });

    // Tell the salon: shows up in the dashboard bell. A failed alert must
    // never fail the customer's booking, so it's fire-and-forget.
    await prisma.notification
      .create({
        data: {
          salonId: salon.id,
          channel: "IN_APP",
          event: "NEW_BOOKING_ALERT",
          recipient: "staff",
          status: "SENT",
          sentAt: new Date(),
          payload: {
            appointmentId: appointment.id,
            customerName: input.customerName,
            serviceName: service.name,
            staffName: staff.name,
            date: input.date,
            time: input.time,
          },
        },
      })
      .catch(() => undefined);

    return NextResponse.json({ reference: appointment.id }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
