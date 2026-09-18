"use client";

import { Phone, Mail, Cake, Wallet, Star, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { initials, formatCurrency } from "@/lib/utils";
import { appointments } from "@/lib/mock-data";
import type { Customer } from "@/lib/types";

const tagVariant: Record<Customer["tags"][number], "gold" | "default" | "confirmed" | "cancelled"> = {
  VIP: "gold",
  New: "confirmed",
  Regular: "default",
  "At risk": "cancelled",
};

export function CustomerProfileDialog({
  customer,
  open,
  onOpenChange,
}: {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!customer) return null;

  const history = appointments
    .filter((a) => a.customerId === customer.id)
    .sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="text-sm">{initials(customer.name)}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle>{customer.name}</DialogTitle>
              <DialogDescription>Customer since {customer.joinedAt}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5">
          {customer.tags.map((tag) => (
            <Badge key={tag} variant={tagVariant[tag]}>
              {tag}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-lg bg-ivory p-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted">Visits</p>
            <p className="mt-1 font-display font-semibold text-ink">{customer.totalVisits}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Total spend</p>
            <p className="mt-1 font-display font-semibold text-ink">{formatCurrency(customer.totalSpend)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Loyalty pts</p>
            <p className="mt-1 font-display font-semibold text-ink">{customer.loyaltyPoints}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Last visit</p>
            <p className="mt-1 font-display font-semibold text-ink">{customer.lastVisit}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm text-ink-soft">
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-muted-soft" /> {customer.phone}
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-muted-soft" /> {customer.email}
          </div>
          <div className="flex items-center gap-2">
            <Cake className="h-3.5 w-3.5 text-muted-soft" /> Birthday: {customer.birthday}
          </div>
          {customer.notes && (
            <div className="flex items-start gap-2 pt-1">
              <Wallet className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-soft" />
              <span className="text-muted">{customer.notes}</span>
            </div>
          )}
        </div>

        <Separator />

        <div>
          <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
            <Clock className="h-3.5 w-3.5" /> Visit history
          </p>
          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {history.length === 0 && (
              <p className="text-sm text-muted-soft">No recorded visits yet.</p>
            )}
            {history.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-ink">{apt.serviceName}</p>
                  <p className="text-xs text-muted">
                    {apt.date} with {apt.staffName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-ink-soft">{formatCurrency(apt.price)}</span>
                  {customer.tags.includes("VIP") && (
                    <Star className="h-3 w-3 fill-gold text-gold" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
