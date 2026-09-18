import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSalonSession, handleApiError } from "@/lib/session-guard";

// List-only for now — same note as /api/customers.
export async function GET() {
  try {
    const { salonId } = await requireSalonSession();
    const staff = await prisma.staff.findMany({
      where: { salonId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(staff);
  } catch (err) {
    return handleApiError(err);
  }
}
