"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    q: "Do I need to install anything?",
    a: "No. Lustre runs entirely in the browser on desktop or mobile — your receptionist can log in from the salon's tablet, and you can check revenue from your phone.",
  },
  {
    q: "How long does setup take?",
    a: "Most salons are fully set up — services, staff, and pricing — in under an hour, and taking live bookings the same day.",
  },
  {
    q: "Can customers really book without calling us?",
    a: "Yes. Your online booking link only shows real, available slots based on stylist schedules, so there's no double-booking to untangle later.",
  },
  {
    q: "What happens to our data if we cancel?",
    a: "You can export your full customer, appointment, and invoice history at any time, with no lock-in.",
  },
];

function Faq() {
  return (
    <div id="faq" className="space-y-3">
      {faqs.map((item) => (
        <details
          key={item.q}
          className="group rounded-lg border border-line bg-card px-5 py-4 open:bg-ivory"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-ink">
            {item.q}
            <Plus className="h-4 w-4 text-gold-deep transition-transform group-open:rotate-45" />
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

function ContactForm() {
  const [sent, setSent] = useState(false);

  return (
    <Card className="p-6">
      {sent ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">
            Request received
          </p>
          <p className="max-w-xs text-sm text-muted">
            A member of our team will reach out within one business day to
            schedule your demo.
          </p>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">Your name</Label>
            <Input id="name" placeholder="Tanvi Oberoi" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="salon">Salon name</Label>
              <Input id="salon" placeholder="Tanvi's Atelier" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" placeholder="+91 98765 43210" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="message">What would you like to see?</Label>
            <Textarea
              id="message"
              placeholder="e.g. We have 3 stylists and want online booking."
            />
          </div>
          <Button type="submit" variant="gold" size="lg" className="w-full">
            Request a demo
          </Button>
        </form>
      )}
    </Card>
  );
}

export function FaqContact() {
  return (
    <section className="border-t border-line bg-bg py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 lg:grid-cols-2">
        <div>
          <span className="cut-line font-display text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">
            Questions
          </span>
          <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Frequently asked
          </h2>
          <div className="mt-10">
            <Faq />
          </div>
        </div>

        <div id="contact">
          <span className="cut-line font-display text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">
            Talk to us
          </span>
          <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Book a demo
          </h2>
          <p className="mt-4 text-muted">
            See Lustre running with your services and pricing before you
            commit to anything.
          </p>
          <div className="mt-10">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
