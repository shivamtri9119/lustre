import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSalonSession, handleApiError } from "@/lib/session-guard";
import { DEFAULT_WORKING_HOURS, monthRange, staffInputSchema, toStaffDto, uniq } from "@/lib/catalog";

// The salon's own team. Scoped to the signed-in salon; the monthly numbers
// are computed from this salon's real appointments, not stored anywhere.

export async function GET() {
  try {
    const { salonId } = await requireSalonSession();
    const { start, end } = monthRange();

    const [staff, booked, completed] = await Promise.all([
      prisma.staff.findMany({
        where: { salonId },
        include: { services: { select: { serviceId: true } } },
        orderBy: { name: "asc" },
      }),
      // Bookings this month = everything that wasn't cancelled.
      prisma.appointment.groupBy({
        by: ["staffId"],
        where: { salonId, date: { gte: start, lt: end }, status: { not: "CANCELLED" } },
        _count: { _all: true },
      }),
      // Revenue this month = only appointments actually completed.
      prisma.appointment.groupBy({
        by: ["staffId"],
        where: { salonId, date: { gte: start, lt: end }, status: "COMPLETED" },
        _sum: { price: true },
      }),
    ]);

    const bookedBy = new Map(booked.map((r) => [r.staffId, r._count._all]));
    const revenueBy = new Map(completed.map((r) => [r.staffId, Number(r._sum.price ?? 0)]));

    return NextResponse.json(
      staff.map((s) =>
        toStaffDto(
          s,
          s.services.map((row) => row.serviceId),
          bookedBy.get(s.id) ?? 0,
          revenueBy.get(s.id) ?? 0
        )
      )
    );
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const { salonId } = await requireSalonSession(["OWNER"]);

    const parsed = staffInputSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid staff details" },
        { status: 400 }
      );
    }
    const { serviceIds: rawServiceIds, ...fields } = parsed.data;
    const serviceIds = uniq(rawServiceIds);

    if (serviceIds.length > 0) {
      const found = await prisma.service.count({ where: { id: { in: serviceIds }, salonId } });
      if (found !== serviceIds.length) {
        return NextResponse.json({ error: "One of the selected services wasn't found" }, { status: 400 });
      }
    }

    const created = await prisma.$transaction(async (tx) => {
      const member = await tx.staff.create({
        data: {
          salonId,
          name: fields.name,
          role: fields.role,
          phone: fields.phone ?? "",
          email: fields.email ?? "",
          workingHours: fields.workingHours || DEFAULT_WORKING_HOURS,
          skills: fields.skills ?? [],
          commissionRate: fields.commissionRate ?? 10,
          status: fields.status ?? "ACTIVE",
        },
      });
      if (serviceIds.length > 0) {
        await tx.serviceStaff.createMany({
          data: serviceIds.map((serviceId) => ({ serviceId, staffId: member.id })),
        });
      }
      return member;
    });

    return NextResponse.json(toStaffDto(created, serviceIds), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
