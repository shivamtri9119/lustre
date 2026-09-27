"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

const GST_RATE = 0.05;

interface InvoiceResult {
  id: string;
  total: string | number;
  pdfUrl: string | null;
}

/**
 * Manual invoicing — for cash/negotiated-price appointments where staff
 * need to apply a discount before the invoice is generated. Most
 * appointments never need this: they invoice automatically on COMPLETED
 * (see [id]/route.ts's PATCH handler). This is the escape hatch.
 */
export function InvoiceDialog({
  appointmentId,
  appointmentPrice,
  open,
  onOpenChange,
  onCreated,
}: {
  appointmentId: string;
  appointmentPrice: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void; // call this to refresh the appointments list so the row flips to "View invoice"
}) {
  const [discount, setDiscount] = React.useState("0");
  const [paymentMethod, setPaymentMethod] = React.useState<"CASH" | "UPI" | "CREDIT_CARD" | "DEBIT_CARD">("CASH");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<InvoiceResult | null>(null);

  const discountNum = Number(discount) || 0;
  const taxable = Math.max(appointmentPrice - discountNum, 0);
  const tax = Math.round(taxable * GST_RATE * 100) / 100;
  const total = Math.round((taxable + tax) * 100) / 100;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch(`/api/appointments/${appointmentId}/invoice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discount: discountNum, paymentMethod }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Couldn't create the invoice.");
      return;
    }
    const invoice: InvoiceResult = await res.json();
    setResult(invoice);
    onCreated();
  }

  function handleClose(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setDiscount("0");
      setPaymentMethod("CASH");
      setResult(null);
      setError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate invoice</DialogTitle>
          <DialogDescription>
            For cash or negotiated-price appointments. GST is fixed at 5%.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <p className="text-sm text-ink">
              Invoice created — total {formatCurrency(Number(result.total))}.
            </p>
            {result.pdfUrl && (
              <a
                href={result.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-gold-deep hover:underline"
              >
                Open PDF
              </a>
            )}
            <DialogFooter>
              <Button variant="gold" onClick={() => handleClose(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="discount">Discount (₹)</Label>
                <Input
                  id="discount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Payment method</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="CREDIT_CARD">Credit card</SelectItem>
                    <SelectItem value="DEBIT_CARD">Debit card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1 rounded-md border border-line bg-ivory px-3 py-2 text-xs text-muted">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(appointmentPrice)}</span></div>
              {discountNum > 0 && <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(discountNum)}</span></div>}
              <div className="flex justify-between"><span>GST (5%)</span><span>{formatCurrency(tax)}</span></div>
              <div className="flex justify-between font-medium text-ink"><span>Total</span><span>{formatCurrency(total)}</span></div>
            </div>

            {error && (
              <p className="rounded-md border border-cancelled-fg/30 bg-cancelled-bg px-3 py-2 text-sm text-cancelled-fg">
                {error}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="gold" disabled={submitting}>
                {submitting ? "Creating…" : "Create invoice"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
