import type { Prisma, PaymentMethod, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateInvoicePdf } from "@/lib/invoice-pdf";
import { uploadInvoicePdf } from "@/lib/cloudinary";

export interface CreateInvoiceOptions {
  discount?: number; // rupees, default 0
  gstRate?: number; // e.g. 0.05 for 5%, default 0.05
  paymentMethod: PaymentMethod; // no sensible default — caller must decide
  paymentStatus?: PaymentStatus; // default PENDING
}

/**
 * Creates the Invoice + InvoiceItem rows for an appointment. Safe to call
 * more than once for the same appointment: Invoice.appointmentId is
 * @unique in the schema, so a second call just returns the existing
 * invoice instead of erroring or duplicating — this is what makes it safe
 * to call from both the manual "Generate invoice" flow and an automatic
 * on-COMPLETED trigger without extra guard logic at every call site.
 */
export async function createInvoiceForAppointment(
  appointmentId: string,
  options: CreateInvoiceOptions
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.invoice.findUnique({ where: { appointmentId } });
    if (existing) return existing;

    const appointment = await tx.appointment.findUnique({
      where: { id: appointmentId },
      include: { service: true },
    });
    if (!appointment) throw new Error(`Appointment ${appointmentId} not found`);

    const subtotal = Number(appointment.price);
    const discount = options.discount ?? 0;
    const gstRate = options.gstRate ?? 0.05;
    const taxable = Math.max(subtotal - discount, 0);
    const tax = Math.round(taxable * gstRate * 100) / 100;
    const total = Math.round((taxable + tax) * 100) / 100;

    // Per-salon sequential invoice numbers (schema requires @@unique on
    // [salonId, invoiceNumber], not globally unique) — generated inside
    // this same transaction so two concurrent invoices for one salon
    // can't land on the same number.
    const last = await tx.invoice.findFirst({
      where: { salonId: appointment.salonId },
      orderBy: { createdAt: "desc" },
      select: { invoiceNumber: true },
    });
    const lastSeq = last ? parseInt(last.invoiceNumber.replace(/\D/g, ""), 10) || 0 : 0;
    const invoiceNumber = `INV-${String(lastSeq + 1).padStart(4, "0")}`;

    return tx.invoice.create({
      data: {
        salonId: appointment.salonId,
        invoiceNumber,
        customerId: appointment.customerId,
        appointmentId: appointment.id,
        subtotal,
        discount,
        tax,
        total,
        paymentStatus: options.paymentStatus ?? "PENDING",
        paymentMethod: options.paymentMethod,
        items: {
          create: [{ serviceName: appointment.service.name, qty: 1, price: subtotal }],
        },
      },
      include: { items: true, customer: true, salon: true },
    });
  });
}

/**
 * Generates the invoice PDF (if not already generated) and uploads it to
 * Cloudinary, saving the URL back onto the Invoice row. Idempotent: if
 * pdfUrl is already set, returns the invoice unchanged rather than
 * regenerating — same "safe to call twice" principle as above.
 *
 * NOTE: this assumes prisma/schema.prisma's Invoice model has pdfPublicId
 * (String?) and pdfExpiresAt (DateTime?) columns for the 30-day cleanup
 * cron discussed earlier in this project. Only pdfUrl was confirmed
 * present when this was written — add the other two via `prisma db push`
 * if they're not there yet, or this will fail to compile against your
 * Prisma client.
 */
export async function storeInvoiceCopy(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: true, customer: true, salon: true },
  });
  if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);
  if (invoice.pdfUrl) return invoice;

  const pdfBuffer = await generateInvoicePdf({
    invoiceNumber: invoice.invoiceNumber,
    createdAt: invoice.createdAt,
    salon: {
      name: invoice.salon.name,
      address: invoice.salon.address,
      phone: invoice.salon.phone,
      email: invoice.salon.email,
      gstin: invoice.salon.gstin,
    },
    customer: { name: invoice.customer.name, phone: invoice.customer.phone },
    items: invoice.items.map((i) => ({
      serviceName: i.serviceName,
      qty: i.qty,
      price: Number(i.price),
    })),
    subtotal: Number(invoice.subtotal),
    discount: Number(invoice.discount),
    tax: Number(invoice.tax),
    total: Number(invoice.total),
    paymentMethod: invoice.paymentMethod,
    paymentStatus: invoice.paymentStatus,
  });

  const { url, publicId, expiresAt } = await uploadInvoicePdf(
    pdfBuffer,
    `${invoice.salonId}/${invoice.id}`
  );

  return prisma.invoice.update({
    where: { id: invoice.id },
    data: { pdfUrl: url, pdfPublicId: publicId, pdfExpiresAt: expiresAt },
    include: { items: true, customer: true, salon: true },
  });
}
