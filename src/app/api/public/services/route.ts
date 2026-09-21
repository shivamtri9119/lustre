import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/session-guard";
import { getPublicSalon } from "@/lib/public-salon";

// F-05 (security audit): a dedicated public read, separate from the
// staff-only GET /api/services. Returns only what an anonymous booking
// visitor needs (name/category/duration/price) — no salonId, no internal
// ids beyond the service's own, nothing staff-only.
export async function GET(req: Request) {
  try {
    const salon = await getPublicSalon(new URL(req.url).searchParams.get("salon"));
    if (!salon) return NextResponse.json([]);

    const services = await prisma.service.findMany({
      // Only services somebody who is currently working can perform —
      // otherwise a customer picks one and hits "no stylists available".
      where: { salonId: salon.id, staff: { some: { staff: { status: "ACTIVE" } } } },
      select: { id: true, name: true, category: true, durationMinutes: true, price: true },
      orderBy: { name: "asc" },
    });

    // Decimal -> number for the client; precision loss is not a concern at
    // rupee-level service pricing.
    const shaped = services.map((s) => ({ ...s, price: Number(s.price) }));
    return NextResponse.json(shaped);
  } catch (err) {
    return handleApiError(err);
  }
}
