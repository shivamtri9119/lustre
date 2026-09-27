import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSalonSession, handleApiError, ForbiddenError } from "@/lib/session-guard";
import { createInvoiceForAppointment, storeInvoiceCopy } from "@/lib/invoice-service";

const bodySchema = z.object({
  discount: z.number().min(0).default(0),
  paymentMethod: z.enum(["CASH", "UPI", "CREDIT_CARD", "DEBIT_CARD"]),
});

// The manual counterpart to auto-invoicing in [id]/route.ts's PATCH
// handler. createInvoiceForAppointment is idempotent on appointmentId
// (unique in the schema), so calling this on an appointment that already
// has an invoice (auto-created or otherwise) just returns the existing
// one rather than erroring — the UI's Generate/View toggle is what
// actually prevents staff from hitting this twice in normal use, but the
// backend doesn't rely on the UI to enforce that.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSalonSession(["OWNER", "RECEPTIONIST"]);
    const { id } = await params;

    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment || appointment.salonId !== session.salonId) {
      throw new ForbiddenError("Appointment not found for this salon");
    }

    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid invoice details", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { discount, paymentMethod } = parsed.data;

    const invoice = await createInvoiceForAppointment(id, {
      discount,
      gstRate: 0.05,
      paymentMethod,
    });
    const withPdf = await storeInvoiceCopy(invoice.id);

    return NextResponse.json(withPdf, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
