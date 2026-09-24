"use client";

import * as React from "react";
import { Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AppointmentDetails {
  id: string;
  date: string;
  time: string;
  status: string;
  notes?: string | null;
  customer: { name: string; phone: string };
  staff: { name: string };
  service: { name: string };
  price: number;
}

/**
 * Give this the appointmentId from a tapped notification and it fetches
 * GET /api/appointments/:id (the route added for exactly this) and shows
 * the details — including the customer's phone, which nothing currently
 * surfaces on tap.
 */
export function AppointmentDetailsDialog({
  appointmentId,
  open,
  onOpenChange,
}: {
  appointmentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [appointment, setAppointment] = React.useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !appointmentId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/appointments/${appointmentId}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error ?? "Failed to load appointment");
        setAppointment(body);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [open, appointmentId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Appointment details</DialogTitle>
        </DialogHeader>

        {loading && <p className="text-sm text-muted">Loading…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {appointment && (
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium">{appointment.customer.name}</p>
              <a
                href={`tel:${appointment.customer.phone}`}
                className="flex items-center gap-1 text-xs text-muted hover:text-ink"
              >
                <Phone className="h-3 w-3" />
                {appointment.customer.phone}
              </a>
            </div>
            <div className="grid grid-cols-2 gap-2 text-muted">
              <span>Service</span>
              <span className="text-right text-ink">{appointment.service.name}</span>
              <span>Staff</span>
              <span className="text-right text-ink">{appointment.staff.name}</span>
              <span>Date</span>
              <span className="text-right text-ink">{appointment.date} at {appointment.time}</span>
              <span>Status</span>
              <span className="text-right text-ink">{appointment.status}</span>
            </div>
            {appointment.notes && (
              <p className="text-xs text-muted">Notes: {appointment.notes}</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
