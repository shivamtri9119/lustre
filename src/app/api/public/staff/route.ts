import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/session-guard";
import { getPublicSalon } from "@/lib/public-salon";

const querySchema = z.object({ serviceId: z.string().min(1) });

// F-05: public read, separate from the staff-only GET /api/staff. Returns
// only name/role/rating/skills for staff who (a) belong to this salon,
// (b) are ACTIVE, and (c) are actually assigned to the requested service —
// never phone, email, commissionRate, or workingHours.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({ serviceId: searchParams.get("serviceId") });
    if (!parsed.success) {
      return NextResponse.json({ error: "serviceId is required" }, { status: 400 });
    }

    const salon = await getPublicSalon(searchParams.get("salon"));
    if (!salon) return NextResponse.json([]);

    // Confirms the service belongs to this salon before using it to filter
    // staff — otherwise a serviceId from another salon (in a future
    // multi-tenant deployment) could be used to enumerate this salon's
    // staff regardless of assignment.
    const service = await prisma.service.findFirst({
      where: { id: parsed.data.serviceId, salonId: salon.id },
      select: { id: true },
    });
    if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

    const staff = await prisma.staff.findMany({
      where: {
        salonId: salon.id,
        status: "ACTIVE",
        services: { some: { serviceId: service.id } },
      },
      select: { id: true, name: true, role: true, rating: true, skills: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(staff);
  } catch (err) {
    return handleApiError(err);
  }
}
