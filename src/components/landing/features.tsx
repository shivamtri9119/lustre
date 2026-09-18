import {
  CalendarCheck,
  Users,
  ReceiptText,
  Boxes,
  LineChart,
  MessageCircleMore,
  Scissors,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: CalendarCheck,
    title: "Appointment management",
    description:
      "Drag-and-drop daily, weekly, and monthly calendars. Book, reschedule, or mark complete in seconds — your receptionist will know it cold by lunchtime.",
  },
  {
    icon: Users,
    title: "Customer CRM",
    description:
      "Every visit, spend, and preference stored against one profile. Know who's overdue for a colour touch-up before they even call.",
  },
  {
    icon: Scissors,
    title: "Staff & commission",
    description:
      "Track working hours, attendance, leave, and commission automatically — no spreadsheet reconciliation at month-end.",
  },
  {
    icon: ReceiptText,
    title: "Automatic invoicing",
    description:
      "The moment a payment is marked complete, a branded PDF invoice is generated, saved, and emailed. Nobody touches a calculator.",
  },
  {
    icon: Boxes,
    title: "Inventory tracking",
    description:
      "Low-stock alerts for colour, shampoo, and consumables before you run out mid-service, not after.",
  },
  {
    icon: LineChart,
    title: "Real business analytics",
    description:
      "Revenue trends, best-selling services, peak hours, and staff efficiency — the numbers an owner actually checks every morning.",
  },
  {
    icon: MessageCircleMore,
    title: "WhatsApp & SMS reminders",
    description:
      "Booking confirmations and appointment reminders go out automatically, cutting no-shows without anyone lifting a phone.",
  },
  {
    icon: Globe,
    title: "Online booking portal",
    description:
      "Customers pick a service, stylist, and time slot themselves — only real availability is ever shown.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-line bg-bg py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-xl">
          <span className="cut-line font-display text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">
            Everything in one dashboard
          </span>
          <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Built around one question
          </h2>
          <p className="mt-4 text-lg text-muted">
            Every feature in Lustre exists to save your front desk time. If
            it doesn&apos;t, it doesn&apos;t ship.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-card p-6 transition-colors hover:bg-ivory"
            >
              <feature.icon className="h-5 w-5 text-gold-deep" strokeWidth={1.75} />
              <h3 className="mt-4 font-display text-base font-semibold text-ink">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
