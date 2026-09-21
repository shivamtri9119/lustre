import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSalonSession, handleApiError } from "@/lib/session-guard";

function num(d: unknown) {
  return d === null || d === undefined ? null : Number(d);
}

export async function GET() {
  try {
    const session = await requireSalonSession(["OWNER"], { skipSubscriptionCheck: true });
    const salonId = session.salonId;

    const [salon, customers, staff, services, appointments, invoices, inventory] =
      await Promise.all([
        prisma.salon.findUnique({ where: { id: salonId } }),
        prisma.customer.findMany({ where: { salonId } }),
        prisma.staff.findMany({ where: { salonId } }),
        prisma.service.findMany({ where: { salonId } }),
        prisma.appointment.findMany({
          where: { salonId },
          include: { customer: true, staff: true, service: true },
          orderBy: { date: "desc" },
        }),
        prisma.invoice.findMany({
          where: { salonId },
          include: { customer: true, items: true },
          orderBy: { createdAt: "desc" },
        }),
        prisma.inventoryItem.findMany({ where: { salonId } }),
      ]);

    if (!salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });

    const exportData = {
      exportedAt: new Date().toISOString(),
      salon: {
        name: salon.name,
        address: salon.address,
        phone: salon.phone,
        email: salon.email,
        gstin: salon.gstin,
        createdAt: salon.createdAt,
      },
      customers: customers.map((c) => ({
        name: c.name,
        phone: c.phone,
        email: c.email,
        birthday: c.birthday,
        notes: c.notes,
        loyaltyPoints: c.loyaltyPoints,
        tags: c.tags,
        joinedAt: c.createdAt,
      })),
      staff: staff.map((s) => ({
        name: s.name,
        role: s.role,
        phone: s.phone,
        email: s.email,
        workingHours: s.workingHours,
        skills: s.skills,
        rating: s.rating,
        commissionRatePercent: s.commissionRate,
        status: s.status,
      })),
      services: services.map((s) => ({
        name: s.name,
        category: s.category,
        durationMinutes: s.durationMinutes,
        price: num(s.price),
      })),
      appointments: appointments.map((a) => ({
        date: a.date,
        time: a.time,
        durationMinutes: a.durationMinutes,
        price: num(a.price),
        status: a.status,
        notes: a.notes,
        customerName: a.customer.name,
        customerPhone: a.customer.phone,
        staffName: a.staff.name,
        serviceName: a.service.name,
      })),
      invoices: invoices.map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customer.name,
        subtotal: num(inv.subtotal),
        discount: num(inv.discount),
        tax: num(inv.tax),
        total: num(inv.total),
        paymentStatus: inv.paymentStatus,
        paymentMethod: inv.paymentMethod,
        createdAt: inv.createdAt,
        items: inv.items.map((i) => ({ serviceName: i.serviceName, qty: i.qty, price: num(i.price) })),
      })),
      inventory: inventory.map((i) => ({
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        unit: i.unit,
        reorderLevel: i.reorderLevel,
        supplier: i.supplier,
        costPerUnit: num(i.costPerUnit),
      })),
    };

    const filename = `lustre-export-${salon.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
