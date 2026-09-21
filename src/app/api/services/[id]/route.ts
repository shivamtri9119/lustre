import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSalonSession, handleApiError } from "@/lib/session-guard";
import { isForeignKeyError, servicePatchSchema, toServiceDto, uniq } from "@/lib/catalog";

type Ctx = { params: Promise<{ id: string }> };

// Edit a service (name, price, duration, category, who performs it).
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { salonId } = await requireSalonSession(["OWNER"]);
    const { id } = await params;

    const parsed = servicePatchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid service details" },
        { status: 400 }
      );
    }

    // 404 (not 403) for another salon's service, so ids can't be probed.
    const existing = await prisma.service.findFirst({ where: { id, salonId }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Service not found" }, { status: 404 });

    const { assignedStaffIds, ...fields } = parsed.data;
    const staffIds = assignedStaffIds === undefined ? undefined : uniq(assignedStaffIds);

    if (staffIds && staffIds.length > 0) {
      const found = await prisma.staff.count({ where: { id: { in: staffIds }, salonId } });
      if (found !== staffIds.length) {
        return NextResponse.json({ error: "One of the selected staff members wasn't found" }, { status: 400 });
      }
    }

    await prisma.$transaction(async (tx) => {
      if (Object.keys(fields).length > 0) {
        await tx.service.update({ where: { id }, data: fields });
      }
      if (staffIds) {
        await tx.serviceStaff.deleteMany({ where: { serviceId: id } });
        if (staffIds.length > 0) {
          await tx.serviceStaff.createMany({
            data: staffIds.map((staffId) => ({ serviceId: id, staffId })),
          });
        }
      }
    });

    const updated = await prisma.service.findUniqueOrThrow({
      where: { id },
      include: { staff: { select: { staffId: true } } },
    });
    return NextResponse.json(toServiceDto(updated, updated.staff.map((r) => r.staffId)));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { salonId } = await requireSalonSession(["OWNER"]);
    const { id } = await params;

    const existing = await prisma.service.findFirst({ where: { id, salonId }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Service not found" }, { status: 404 });

    try {
      await prisma.service.delete({ where: { id } });
    } catch (err) {
      // Past and upcoming appointments point at this service; deleting it
      // would erase the record of what was booked.
      if (isForeignKeyError(err)) {
        return NextResponse.json(
          { error: "This service has appointments, so it can't be deleted. Unassign its staff instead to stop new bookings." },
          { status: 409 }
        );
      }
      throw err;
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
