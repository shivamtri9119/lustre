"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShieldCheck, Loader2, Download, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Plan = "MONTHLY" | "YEARLY";

const FEATURES = [
  "Unlimited appointments & staff accounts",
  "Automatic invoicing — generated, emailed, and filed on payment",
  "Public online booking page for your customers",
  "Inventory tracking with low-stock alerts",
  "Revenue, retention & staff-performance analytics",
];

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function SubscribeClient({
  isOwner,
  ownerName,
  ownerEmail,
  hadPreviousPlan,
  daysUntilDeletion,
}: {
  isOwner: boolean;
  ownerName: string | null;
  ownerEmail: string | null;
  hadPreviousPlan: boolean;
  daysUntilDeletion: number | null;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>("YEARLY");
  const [status, setStatus] = useState<"idle" | "processing" | "verifying">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!isOwner) {
    return (
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Lustre is paused for your salon
        </h1>
        <p className="mt-2 text-sm text-muted">
          {ownerName
            ? `Ask ${ownerName} to renew the subscription to get back in.`
            : "Ask your salon owner to renew the subscription to get back in."}
        </p>
        {ownerEmail && (
          <div className="mt-6 rounded-lg border border-line bg-card p-4 text-sm">
            <p className="text-muted">Salon owner</p>
            <p className="mt-1 font-medium text-ink">{ownerName}</p>
            <p className="text-ink-soft">{ownerEmail}</p>
          </div>
        )}
      </div>
    );
  }

  async function handlePay() {
    setError(null);
    setStatus("processing");
    try {
      const orderRes = await fetch("/api/billing/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!orderRes.ok) {
        const body = await orderRes.json().catch(() => null);
        throw new Error(body?.error ?? "Couldn't start checkout.");
      }
      const order = await orderRes.json();

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error("Couldn't load the payment window. Check your connection and try again.");

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Lustre",
        description: plan === "YEARLY" ? "Lustre — Yearly plan" : "Lustre — Monthly plan",
        theme: { color: "#D4AF37" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          setStatus("verifying");
          try {
            const verifyRes = await fetch("/api/billing/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...response, plan }),
            });
            if (!verifyRes.ok) {
              const body = await verifyRes.json().catch(() => null);
              throw new Error(body?.error ?? "Payment could not be verified.");
            }
            router.push("/dashboard");
            router.refresh();
          } catch (e) {
            setStatus("idle");
            setError(e instanceof Error ? e.message : "Payment could not be verified.");
          }
        },
        modal: {
          ondismiss: () => setStatus("idle"),
        },
      });
      razorpay.open();
      setStatus("idle");
    } catch (e) {
      setStatus("idle");
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    }
  }

  const price = plan === "YEARLY" ? 4999 : 499;
  const busy = status !== "idle";

  return (
    <div className="w-full max-w-md">
      <h1 className="font-display text-2xl font-semibold text-ink">
        {hadPreviousPlan ? "Renew your subscription" : "Activate your subscription"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        One plan, everything included. Pick monthly or yearly.
      </p>

      {daysUntilDeletion !== null && daysUntilDeletion <= 30 && (
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-cancelled-fg/30 bg-cancelled-bg px-3.5 py-3 text-sm text-cancelled-fg">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {daysUntilDeletion <= 0
              ? "Your data is scheduled for deletion very soon — download it now if you want to keep it."
              : `Your salon's data will be permanently deleted in ${daysUntilDeletion} day${daysUntilDeletion === 1 ? "" : "s"} if this stays unpaid. Download a copy below any time before then.`}
          </p>
        </div>
      )}

      <div className="mt-6 inline-flex rounded-lg border border-line bg-card p-1">
        {(["MONTHLY", "YEARLY"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPlan(p)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              plan === p ? "bg-ink text-white" : "text-ink-soft hover:text-ink"
            )}
          >
            {p === "MONTHLY" ? "Monthly" : "Yearly"}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-line bg-card p-6">
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

        <ul className="mt-6 space-y-3">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-ink-soft">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
              {f}
            </li>
          ))}
        </ul>

        <Button
          variant="gold"
          size="lg"
          className="mt-7 w-full"
          onClick={handlePay}
          disabled={busy}
        >
          {status === "verifying" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Confirming payment…
            </>
          ) : status === "processing" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Opening checkout…
            </>
          ) : (
            `Pay ₹${price.toLocaleString("en-IN")} with Razorpay`
          )}
        </Button>

        {error && (
          <p className="mt-3 rounded-md border border-cancelled-fg/30 bg-cancelled-bg px-3 py-2 text-sm text-cancelled-fg">
            {error}
          </p>
        )}

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-soft">
          <ShieldCheck className="h-3.5 w-3.5" />
          Secured by Razorpay — cards, UPI, and netbanking accepted
        </p>
      </div>

      <a
        href="/api/account/export"
        download
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-card py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-gold-deep hover:text-ink"
      >
        <Download className="h-4 w-4" />
        Download all your data
      </a>
      <p className="mt-2 text-center text-xs text-muted-soft">
        Customers, appointments, invoices, and inventory — a full copy, whether or not you renew.
      </p>
    </div>
  );
}
