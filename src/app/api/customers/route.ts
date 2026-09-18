import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSalonSession, handleApiError } from "@/lib/session-guard";

// List-only for now. Create/edit/delete (the audit's "no Add Customer
// button anywhere" finding) is still open — see the summary — but this
// unblocks the appointment picker from pointing at mock IDs that don't
// exist in a real database.
export async function GET() {
  try {
    const { salonId } = await requireSalonSession();
    const customers = await prisma.customer.findMany({
      where: { salonId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(customers);
  } catch (err) {
    return handleApiError(err);
  }
}
