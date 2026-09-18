# Lustre — Salon Management Platform

A premium SaaS salon management platform for **Aura Salon & Spa** (demo
tenant) — appointments, customer CRM, staff, services, billing, inventory,
analytics, and online booking in one dashboard.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, hand-built
Radix/ShadCN-style UI primitives, and a Prisma + PostgreSQL schema.

---

## Status: what's real vs. what's mocked

Every screen in this app is fully built, navigable, and interactive. To get
there without a live database, two layers are mocked **on purpose**, clearly
marked in code:

| Layer | Current state | Real implementation |
|---|---|---|
| **Data** | `src/lib/mock-data.ts` — realistic Aura Salon & Spa dataset | Prisma queries against PostgreSQL (schema is ready — see below) |
| **Auth** | `src/lib/auth-context.tsx` — a "Viewing as" switcher in the topbar fakes OWNER/RECEPTIONIST/STYLIST sessions | Auth.js (NextAuth) v5 + Google provider + JWT sessions, using the `User`/`Account`/`Session` models already in `prisma/schema.prisma` |
| **Appointments state** | `src/lib/appointments-store.tsx` — a React Context that lets Create/Reschedule/Cancel/Complete actually work for the session | API routes (`/api/appointments`) backed by Prisma, with optimistic UI updates |
| **Invoices** | Generated and previewable; "Download PDF" / "Print" use the browser's native print-to-PDF | Server-side PDF generation with PDFKit, triggered automatically when an invoice is marked paid, uploaded to Cloudinary, and emailed via Resend |
| **WhatsApp / SMS / Email notifications** | Not sent — there's a `Notification` model in the schema ready to log them | Meta WhatsApp Cloud API, an SMS provider (Twilio/MSG91), and Resend — see `.env.example` for the exact keys needed |

Nothing here is a placeholder UI — every button, dialog, and table is wired
to real (mock) state and updates the screen when you use it.

---

## Getting started

```bash
npm install

# 1. Point DATABASE_URL at a real Postgres instance (.env.example -> .env)
cp .env.example .env

# 2. Generate the Prisma client and create tables
npx prisma generate
npx prisma migrate dev --name init

# 3. Seed realistic demo data (same dataset as the mock layer)
npx prisma db seed

# 4. Run the app
npm run dev
```

> **Note on this build:** the sandbox this was built in couldn't reach
> `binaries.prisma.sh`, so `prisma generate`/`migrate` were never run here —
> the schema is hand-written and reviewed carefully, but run `npx prisma
> validate` yourself as a first check once you have normal network access.

---

## Architecture decisions worth knowing

**Next.js Route Handlers instead of a standalone Express server.**
The original brief calls for Node.js/Express, but Vercel deploys Next.js as
serverless functions, not a long-running Express process. Route Handlers
(`src/app/api/.../route.ts`) are the practical equivalent — same Node.js
runtime, same Prisma client, zero extra infrastructure. If you later need a
standalone API (e.g. for a separate mobile app), the query logic below lifts
directly into Express controllers with almost no changes.

**The exact API route this app is built to call** (omitted from the shipped
build only because the Prisma client isn't generated in this sandbox):

```ts
// src/app/api/appointments/route.ts
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const appointments = await prisma.appointment.findMany({
    where: date ? { date: new Date(date) } : undefined,
    include: { customer: true, staff: true, service: true },
    orderBy: { time: "asc" },
  });
  return Response.json(appointments);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const appointment = await prisma.appointment.create({ data: body });
  // → enqueue BOOKING_CONFIRMATION notification (WhatsApp/SMS/email) here
  return Response.json(appointment, { status: 201 });
}
```

Once `prisma generate` has run locally, drop that file in and swap
`AppointmentsProvider`'s mock state for `fetch` calls — the component API
(`addAppointment`, `updateStatus`, `reschedule`) is already shaped to make
that a small change, not a rewrite.

**Self-hosted fonts.** `next/font/google` needs to fetch `fonts.googleapis.com`
at build time, which this sandbox's network allowlist blocks. Switched to
`@fontsource/inter` + `@fontsource/poppins` (ships the font files in
`node_modules`, zero network calls at build time) — this works identically,
and arguably more robustly, on Vercel too.

**Print-to-PDF for invoices.** `window.print()` on a dedicated `#print-area`
is the fastest path to a working "Download PDF" today. It's a real, usable
feature — but the brief's "auto-generate → save → email" flow needs
server-side generation (PDFKit) so it can run without a browser open. The
`Invoice.pdfUrl` field in the schema is where that generated file's
Cloudinary URL would live.

---

## Project structure

```
src/
  app/
    page.tsx                 # Landing page
    login/ signup/ forgot-password/
    book/                    # Public online booking portal
    (dashboard)/             # Route group sharing the sidebar+topbar shell
      layout.tsx
      dashboard/             # Overview: stats, revenue chart, staff, upcoming
      appointments/          # Daily/Weekly/Monthly calendar views
      customers/             # CRM table + profile dialog
      staff/                 # Staff cards, utilization, commission
      services/              # Service catalog + staff assignment
      billing/               # Invoices, payment status, PDF preview
      inventory/              # Stock levels, low-stock alerts
      analytics/              # Revenue trend, best services, peak hours
  components/
    ui/                      # Hand-built ShadCN-style primitives (Radix-based)
    landing/  auth/  dashboard/  appointments/  customers/
    staff/  services/  billing/  inventory/  analytics/  booking/
  lib/
    types.ts                 # Mirrors the Prisma schema
    mock-data.ts              # Realistic Aura Salon & Spa dataset
    auth-context.tsx          # Mock role-based session
    appointments-store.tsx    # Mock client-side appointments state
prisma/
  schema.prisma               # Full production schema (multi-tenant)
  seed.ts                     # Seeds the same demo data via Prisma
```

---

## What's next (in priority order)

1. **Real auth** — Auth.js v5 + Prisma adapter + Google provider, replacing `auth-context.tsx`
2. **Wire Prisma** — implement the Route Handlers (pattern above) for each module, replace mock imports with `fetch`
3. **Server-side PDF + auto-email** — PDFKit + Resend, triggered on `paymentStatus: PAID`
4. **WhatsApp/SMS reminders** — a scheduled job (e.g. Vercel Cron) querying tomorrow's `Appointment`s and sending via the Meta Cloud API
5. **Multi-tenant onboarding** — currently single-salon; the schema already supports many `Salon`s, so this is mostly a signup-flow + middleware change
6. **Drag-and-drop calendar reordering** — intentionally scoped out of this pass; needs conflict-detection logic
