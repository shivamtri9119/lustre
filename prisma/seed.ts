// Seeds a freshly-migrated database with the same Aura Salon & Spa demo data
// used by the mock layer, so the live app and the design demo match.
//
// Run with: npx prisma db seed
// (requires `npx prisma generate` and `npx prisma migrate dev` to have been
// run first, in an environment with normal network access)

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const salon = await prisma.salon.create({
    data: {
      name: "Aura Salon & Spa",
      address: "14 Lakeview Road, Civil Lines, Farrukhabad, UP 209625",
      phone: "+91 98765 43210",
      email: "hello@aurasalon.in",
      gstin: "09ABCDE1234F1Z5",
    },
  });

  const [priya, rohan, ananya, kabir] = await Promise.all([
    prisma.staff.create({
      data: {
        salonId: salon.id,
        name: "Priya Sharma",
        role: "Senior Stylist",
        phone: "+91 90011 22334",
        email: "priya@aurasalon.in",
        workingHours: "10:00 AM – 7:00 PM",
        skills: ["Haircut", "Hair Color", "Styling"],
        rating: 4.9,
        commissionRate: 18,
      },
    }),
    prisma.staff.create({
      data: {
        salonId: salon.id,
        name: "Rohan Mehta",
        role: "Barber & Grooming Expert",
        phone: "+91 90022 33445",
        email: "rohan@aurasalon.in",
        workingHours: "10:00 AM – 7:00 PM",
        skills: ["Haircut", "Beard Styling", "Shave"],
        rating: 4.8,
        commissionRate: 15,
      },
    }),
    prisma.staff.create({
      data: {
        salonId: salon.id,
        name: "Ananya Iyer",
        role: "Esthetician",
        phone: "+91 90033 44556",
        email: "ananya@aurasalon.in",
        workingHours: "11:00 AM – 8:00 PM",
        skills: ["Facial", "Skin Treatment", "Makeup"],
        rating: 4.95,
        commissionRate: 20,
      },
    }),
    prisma.staff.create({
      data: {
        salonId: salon.id,
        name: "Kabir Singh",
        role: "Junior Stylist",
        phone: "+91 90044 55667",
        email: "kabir@aurasalon.in",
        workingHours: "10:00 AM – 6:00 PM",
        skills: ["Haircut", "Hair Spa"],
        rating: 4.6,
        commissionRate: 12,
        status: "ON_LEAVE",
      },
    }),
  ]);

  const services = await Promise.all([
    prisma.service.create({
      data: { salonId: salon.id, name: "Classic Haircut", category: "Hair", durationMinutes: 30, price: 400 },
    }),
    prisma.service.create({
      data: { salonId: salon.id, name: "Beard Styling", category: "Grooming", durationMinutes: 20, price: 250 },
    }),
    prisma.service.create({
      data: { salonId: salon.id, name: "Hair Color – Global", category: "Hair", durationMinutes: 90, price: 2200 },
    }),
    prisma.service.create({
      data: { salonId: salon.id, name: "Signature Facial", category: "Skin", durationMinutes: 60, price: 1800 },
    }),
    prisma.service.create({
      data: { salonId: salon.id, name: "Bridal Makeup", category: "Makeup", durationMinutes: 120, price: 8500 },
    }),
  ]);

  await prisma.serviceStaff.createMany({
    data: [
      { serviceId: services[0].id, staffId: priya.id },
      { serviceId: services[0].id, staffId: rohan.id },
      { serviceId: services[0].id, staffId: kabir.id },
      { serviceId: services[1].id, staffId: rohan.id },
      { serviceId: services[2].id, staffId: priya.id },
      { serviceId: services[3].id, staffId: ananya.id },
      { serviceId: services[4].id, staffId: ananya.id },
    ],
  });

  const customer = await prisma.customer.create({
    data: {
      salonId: salon.id,
      name: "Neha Kapoor",
      phone: "+91 98110 23456",
      email: "neha.kapoor@gmail.com",
      birthday: "03-14",
      notes: "Prefers Priya for color. Allergic to ammonia-based dyes.",
      loyaltyPoints: 486,
      tags: ["VIP", "Regular"],
    },
  });

  await prisma.inventoryItem.createMany({
    data: [
      { salonId: salon.id, name: "Ammonia-Free Hair Color (Brown)", category: "Hair Color", quantity: 4, unit: "tubes", reorderLevel: 8, supplier: "L'Oréal Professionnel", costPerUnit: 420 },
      { salonId: salon.id, name: "Keratin Shampoo 1L", category: "Hair Care", quantity: 12, unit: "bottles", reorderLevel: 6, supplier: "Schwarzkopf", costPerUnit: 650 },
    ],
  });

  console.log(`Seeded salon "${salon.name}" with ${services.length} services and 1 sample customer (${customer.name}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
