import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSalonSession, handleApiError } from "@/lib/session-guard";
import { isForeignKeyError, staffPatchSchema, toStaffDto, uniq } from "@/lib/catalog";

type Ctx = { params: Promise<{ id: string }> };

// Edit a staff member: details, on-leave status, and which services they do.
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { salonId } = await requireSalonSession(["OWNER"]);
    const { id } = await params;

    const parsed = staffPatchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid staff details" },
        { status: 400 }
      );
    }

    const existing = await prisma.staff.findFirst({ where: { id, salonId }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

    const { serviceIds: rawServiceIds, ...fields } = parsed.data;
    const serviceIds = rawServiceIds === undefined ? undefined : uniq(rawServiceIds);

    if (serviceIds && serviceIds.length > 0) {
      const found = await prisma.service.count({ where: { id: { in: serviceIds }, salonId } });
      if (found !== serviceIds.length) {
        return NextResponse.json({ error: "One of the selected services wasn't found" }, { status: 400 });
      }
    }

    await prisma.$transaction(async (tx) => {
      if (Object.keys(fields).length > 0) {
        await tx.staff.update({
          where: { id },
          data: { ...fields, workingHours: fields.workingHours || undefined },
        });
      }
      if (serviceIds) {
        await tx.serviceStaff.deleteMany({ where: { staffId: id } });
        if (serviceIds.length > 0) {
          await tx.serviceStaff.createMany({
            data: serviceIds.map((serviceId) => ({ serviceId, staffId: id })),
          });
        }
      }
    });

    const updated = await prisma.staff.findUniqueOrThrow({
      where: { id },
      include: { services: { select: { serviceId: true } } },
    });
    // Monthly figures aren't recomputed here; the page reloads the list.
    return NextResponse.json(toStaffDto(updated, updated.services.map((r) => r.serviceId)));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { salonId } = await requireSalonSession(["OWNER"]);
    const { id } = await params;

    const existing = await prisma.staff.findFirst({ where: { id, salonId }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

    try {
      await prisma.staff.delete({ where: { id } });
    } catch (err) {
      if (isForeignKeyError(err)) {
        return NextResponse.json(
          { error: "This person has appointments on record, so they can't be removed. Mark them as on leave instead." },
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
