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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useAppointments, type NewAppointmentInput } from "@/lib/appointments-store";
import type { AppointmentStatus } from "@/lib/types";

const NEW_CUSTOMER = "__new__";

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
}
interface StaffOption {
  id: string;
  name: string;
}
interface ServiceApiRow {
  id: string;
  name: string;
  price: string | number;
  durationMinutes: number;
  assignedStaffIds: string[];
}
interface ServiceOption {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  assignedStaffIds: string[];
}

export function NewAppointmentDialog({
  trigger,
  defaultDate,
}: {
  trigger?: React.ReactNode;
  defaultDate?: string;
}) {
  const { addAppointment } = useAppointments();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const [customers, setCustomers] = React.useState<CustomerOption[]>([]);
  const [staff, setStaff] = React.useState<StaffOption[]>([]);
  const [services, setServices] = React.useState<ServiceOption[]>([]);
  const [optionsLoading, setOptionsLoading] = React.useState(false);

  const [customerId, setCustomerId] = React.useState("");
  const [newName, setNewName] = React.useState("");
  const [newPhone, setNewPhone] = React.useState("");
  const [serviceId, setServiceId] = React.useState("");
  const [staffId, setStaffId] = React.useState("");
  const [date, setDate] = React.useState(defaultDate ?? new Date().toISOString().slice(0, 10));
  const [time, setTime] = React.useState("10:00");
  const [status, setStatus] = React.useState<AppointmentStatus>("CONFIRMED");
  const [notes, setNotes] = React.useState("");

  // Fetch real customers/staff/services (salon-scoped, via the session)
  // each time the dialog opens, instead of importing the frozen mock
  // arrays. This also means selecting an "existing customer" here now
  // always resolves to a real database row. Triggered from the dialog's
  // open handler below (an event), not a useEffect watching `open` —
  // this is a one-off "user opened the dialog" action, not state kept in
  // sync with an external system.
  function loadOptions() {
    setOptionsLoading(true);
    Promise.all([
      fetch("/api/customers").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/staff").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/services").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([c, s, sv]: [CustomerOption[], StaffOption[], ServiceApiRow[]]) => {
        setCustomers(c);
        setStaff(s);
        setServices(sv.map((row) => ({ ...row, price: Number(row.price) })));
      })
      .finally(() => setOptionsLoading(false));
  }

  const service = services.find((s) => s.id === serviceId);
  const eligibleStaff = service
    ? staff.filter((s) => service.assignedStaffIds.includes(s.id))
    : staff;

  function reset() {
    setCustomerId("");
    setNewName("");
    setNewPhone("");
    setServiceId("");
    setStaffId("");
    setTime("10:00");
    setStatus("CONFIRMED");
    setNotes("");
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!service || !staffId) return;
    if (customerId === NEW_CUSTOMER ? !newName || !newPhone : !customerId) return;

    setSubmitting(true);
    const input: NewAppointmentInput = {
      staffId,
      serviceId: service.id,
      date,
      time,
      status,
      notes: notes || undefined,
      ...(customerId === NEW_CUSTOMER
        ? { newCustomer: { name: newName, phone: newPhone } }
        : { customerId }),
    };
    const result = await addAppointment(input);
    setSubmitting(false);

    if (!result.ok) {
      // This is the fix for the audit's core booking bug: creating a
      // conflicting appointment now surfaces the real reason instead of
      // silently succeeding.
      setFormError(result.error);
      return;
    }
    setOpen(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) loadOptions(); else setFormError(null); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="gold" size="default">
            <Plus className="h-4 w-4" />
            New Appointment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New appointment</DialogTitle>
          <DialogDescription>
            Takes under 30 seconds — pick a customer, service, and slot.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Customer</Label>
            <Select value={customerId} onValueChange={setCustomerId} disabled={optionsLoading}>
              <SelectTrigger>
                <SelectValue placeholder={optionsLoading ? "Loading customers…" : "Select existing customer"} />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} · {c.phone}
                  </SelectItem>
                ))}
                <SelectItem value={NEW_CUSTOMER}>+ New customer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {customerId === NEW_CUSTOMER && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-name">Full name</Label>
                <Input id="new-name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-phone">Mobile number</Label>
                <Input id="new-phone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} required />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Service</Label>
              <Select
                value={serviceId}
                onValueChange={(v) => { setServiceId(v); setStaffId(""); }}
                disabled={optionsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={optionsLoading ? "Loading…" : "Choose service"} />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} · ₹{s.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Stylist</Label>
              <Select value={staffId} onValueChange={setStaffId} disabled={optionsLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Assign staff" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleStaff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time">Time</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as AppointmentStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, preferences, special requests..." />
          </div>

          {formError && (
            <p className="rounded-md border border-cancelled-fg/30 bg-cancelled-bg px-3 py-2 text-sm text-cancelled-fg">
              {formError}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" disabled={submitting || optionsLoading}>
              {submitting ? "Creating…" : "Create appointment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
