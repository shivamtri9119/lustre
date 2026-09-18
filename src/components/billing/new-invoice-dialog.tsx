"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
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
import { customers, services } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import type { Invoice, PaymentMethod } from "@/lib/types";

const TAX_RATE = 0.05;

export function NewInvoiceDialog({
  onCreate,
}: {
  onCreate: (invoice: Omit<Invoice, "id" | "invoiceNumber">) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [customerId, setCustomerId] = React.useState("");
  const [serviceIds, setServiceIds] = React.useState<string[]>([]);
  const [discount, setDiscount] = React.useState("0");
  const [method, setMethod] = React.useState<PaymentMethod>("UPI");

  const selectedServices = services.filter((s) => serviceIds.includes(s.id));
  const subtotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const total = Math.max(subtotal + tax - Number(discount || 0), 0);

  function toggleService(id: string) {
    setServiceIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const customer = customers.find((c) => c.id === customerId);
    if (!customer || selectedServices.length === 0) return;

    onCreate({
      customerId: customer.id,
      customerName: customer.name,
      date: new Date().toISOString().slice(0, 10),
      items: selectedServices.map((s) => ({ serviceName: s.name, qty: 1, price: s.price })),
      subtotal,
      discount: Number(discount || 0),
      tax,
      total,
      paymentStatus: "PAID",
      paymentMethod: method,
      emailSent: true,
    });

    setOpen(false);
    setCustomerId("");
    setServiceIds([]);
    setDiscount("0");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gold">
          <Plus className="h-4 w-4" />
          New invoice
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate invoice</DialogTitle>
          <DialogDescription>
            Marking this paid sends the PDF to the customer automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Customer</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Services rendered</Label>
            <div className="flex flex-wrap gap-2">
              {services.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => toggleService(s.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    serviceIds.includes(s.id)
                      ? "border-gold-deep bg-gold/15 text-gold-deep"
                      : "border-line text-muted hover:text-ink"
                  }`}
                >
                  {s.name} · ₹{s.price}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="discount">Discount (₹)</Label>
              <Input
                id="discount"
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
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

          <div className="rounded-lg bg-ivory p-3 text-sm">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Tax (5%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-line pt-1 font-semibold text-ink">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" disabled={!customerId || selectedServices.length === 0}>
              Generate & send
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
