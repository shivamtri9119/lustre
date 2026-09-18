"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEATURES = [
  "Unlimited appointments & staff accounts",
  "Automatic invoicing — generated, emailed, and filed on payment",
  "Public online booking page for your customers",
  "Inventory tracking with low-stock alerts",
  "Revenue, retention & staff-performance analytics",
  "WhatsApp & email reminders",
];

export function Pricing() {
  const [plan, setPlan] = useState<"MONTHLY" | "YEARLY">("YEARLY");
  const price = plan === "YEARLY" ? 4999 : 499;

  return (
    <section id="pricing" className="border-t border-line bg-bg py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <span className="cut-line font-display text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">
            Simple pricing
          </span>
          <h2 className="mx-auto mt-6 max-w-lg font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            One plan for every chair in the salon
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted">
            Everything Lustre does, in a single plan. No feature gates, no per-booking charges.
          </p>
        </div>

        <div className="mx-auto mt-10 flex justify-center">
          <div className="inline-flex rounded-lg border border-line bg-card p-1">
            {(["MONTHLY", "YEARLY"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className={cn(
                  "rounded-md px-5 py-2 text-sm font-medium transition-colors",
                  plan === p ? "bg-ink text-white" : "text-ink-soft hover:text-ink"
                )}
              >
                {p === "MONTHLY" ? "Monthly" : "Yearly"}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-md">
          <Card className="flex flex-col border-gold p-8 shadow-lg ring-1 ring-gold/30">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-4xl font-semibold text-ink">
                ₹{price.toLocaleString("en-IN")}
              </span>
              <span className="text-sm text-muted">/ {plan === "YEARLY" ? "year" : "month"}</span>
            </div>
            {plan === "YEARLY" ? (
              <p className="mt-1.5 text-sm text-gold-deep">Save ₹989 a year — works out to ₹417/month</p>
            ) : (
              <p className="mt-1.5 text-sm text-muted">Or ₹4,999/year and save ₹989</p>
            )}

            <ul className="mt-7 flex-1 space-y-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-ink-soft">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
                  {f}
                </li>
              ))}
            </ul>

            <Button variant="gold" size="lg" className="mt-8 w-full" asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </Card>
        </div>
      </div>
    </section>
  );
}
