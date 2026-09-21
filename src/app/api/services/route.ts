import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSalonSession, handleApiError } from "@/lib/session-guard";
import { serviceInputSchema, toServiceDto, uniq } from "@/lib/catalog";

// The salon's own service menu. Everything here is scoped to the signed-in
// salon (salonId comes from the session, never from the request), and it's
// the same data the public booking page and the New Appointment dialog read.

export async function GET() {
  try {
    const { salonId } = await requireSalonSession();
    const services = await prisma.service.findMany({
      where: { salonId },
      include: { staff: { select: { staffId: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(
      services.map((s) => toServiceDto(s, s.staff.map((row) => row.staffId)))
    );
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const { salonId } = await requireSalonSession(["OWNER"]);

    const parsed = serviceInputSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid service details" },
        { status: 400 }
      );
    }
    const { assignedStaffIds, ...fields } = parsed.data;
    const staffIds = uniq(assignedStaffIds);

    // Only staff from THIS salon can be assigned.
    if (staffIds.length > 0) {
      const found = await prisma.staff.count({ where: { id: { in: staffIds }, salonId } });
      if (found !== staffIds.length) {
        return NextResponse.json({ error: "One of the selected staff members wasn't found" }, { status: 400 });
      }
    }

    const created = await prisma.$transaction(async (tx) => {
      const service = await tx.service.create({ data: { salonId, ...fields } });
      if (staffIds.length > 0) {
        await tx.serviceStaff.createMany({
          data: staffIds.map((staffId) => ({ serviceId: service.id, staffId })),
        });
      }
      return service;
    });

    return NextResponse.json(toServiceDto(created, staffIds), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
