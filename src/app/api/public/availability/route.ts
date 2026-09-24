import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/session-guard";
import { getPublicSalon } from "@/lib/public-salon";
import { getAvailableSlots } from "@/lib/scheduling";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const querySchema = z.object({
  serviceId: z.string().min(1),
  staffId: z.string().min(1),
  date: z.string().regex(dateRegex),
  // Matches the "salon" param every other public route and every booking
  // step component (service-step.tsx, stylist-step.tsx) sends — this file
  // used to expect "slug" instead, which meant searchParams.get() always
  // returned null here. z.string().optional() accepts a missing key
  // (undefined) but NOT null, so that null failed validation on every
  // single request, regardless of what else was sent — see the salon
  // lookup below for how the value is actually turned into a salon.
  salon: z.string().optional(),
});

// F-05: this is the read side of the same conflict logic the write
// endpoint (POST /api/public/appointments) enforces — it only tells the
// visitor which slots are open, never who holds the booked ones. No
// customer name, phone, or appointment id is present anywhere in the
// response.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      serviceId: searchParams.get("serviceId"),
      staffId: searchParams.get("staffId"),
      date: searchParams.get("date"),
      salon: searchParams.get("salon") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "serviceId, staffId, and date (YYYY-MM-DD) are required" },
        { status: 400 }
      );
    }
    const { serviceId, staffId, date, salon: salonSlug } = parsed.data;

    const requestedDate = new Date(`${date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (requestedDate < today) {
      return NextResponse.json({ error: "Date is in the past" }, { status: 400 });
    }

    const salon = await getPublicSalon(salonSlug);
    if (!salon) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [service, staff] = await Promise.all([
      prisma.service.findFirst({ where: { id: serviceId, salonId: salon.id } }),
      prisma.staff.findFirst({
        where: { id: staffId, salonId: salon.id, status: "ACTIVE", services: { some: { serviceId } } },
      }),
    ]);
    if (!service || !staff) {
      return NextResponse.json({ error: "Service or stylist not found" }, { status: 404 });
    }

    const existing = await prisma.appointment.findMany({
      where: { salonId: salon.id, staffId, date: requestedDate, status: { not: "CANCELLED" } },
      select: { id: true, time: true, durationMinutes: true },
    });

    const slots = getAvailableSlots(
      existing,
      service.durationMinutes,
      staff.workStartMinutes,
      staff.workEndMinutes
    );
    return NextResponse.json(slots.map((s) => ({ value: s.value, label: s.label })));
  } catch (err) {
    return handleApiError(err);
  }
}
