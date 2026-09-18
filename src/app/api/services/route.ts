import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSalonSession, handleApiError } from "@/lib/session-guard";

// List-only for now — same note as /api/customers.
export async function GET() {
  try {
    const { salonId } = await requireSalonSession();
    const services = await prisma.service.findMany({
      where: { salonId },
      include: { staff: { select: { staffId: true } } },
      orderBy: { name: "asc" },
    });
    // Flatten the join table to the assignedStaffIds[] shape the existing
    // frontend components already expect (see lib/types.ts Service).
    const shaped = services.map((s) => ({
      ...s,
      assignedStaffIds: s.staff.map((row) => row.staffId),
      staff: undefined,
    }));
    return NextResponse.json(shaped);
  } catch (err) {
    return handleApiError(err);
  }
}
