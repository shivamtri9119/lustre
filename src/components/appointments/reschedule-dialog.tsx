"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppointments } from "@/lib/appointments-store";
import type { Appointment } from "@/lib/types";

export function RescheduleDialog({
  appointment,
  open,
  onOpenChange,
}: {
  appointment: Appointment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { reschedule } = useAppointments();
  const [date, setDate] = React.useState(appointment.date);
  const [time, setTime] = React.useState(appointment.time);
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    if (next) {
      setDate(appointment.date);
      setTime(appointment.time);
      setFormError(null);
    }
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    // Previously this closed the dialog unconditionally, with zero check
    // for whether the new slot was already taken by the same staff member.
    // Now the server checks (src/app/api/appointments/[id]/route.ts) and a
    // conflict comes back as a real error instead of a silent, wrong success.
    const result = await reschedule(appointment.id, date, time);
    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule appointment</DialogTitle>
          <DialogDescription>
            {appointment.customerName} · {appointment.serviceName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="r-date">New date</Label>
              <Input id="r-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-time">New time</Label>
              <Input id="r-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>

          {formError && (
            <p className="rounded-md border border-cancelled-fg/30 bg-cancelled-bg px-3 py-2 text-sm text-cancelled-fg">
              {formError}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" disabled={submitting}>
              {submitting ? "Saving…" : "Confirm new slot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
