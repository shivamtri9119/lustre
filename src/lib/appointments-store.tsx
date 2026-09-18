"use client";

import * as React from "react";
import type { Appointment, AppointmentStatus } from "@/lib/types";

export interface NewAppointmentInput {
  customerId?: string;
  newCustomer?: { name: string; phone: string };
  staffId: string;
  serviceId: string;
  date: string;
  time: string;
  status?: AppointmentStatus;
  notes?: string;
}

type MutationResult = { ok: true } | { ok: false; error: string };

interface AppointmentsContextValue {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addAppointment: (input: NewAppointmentInput) => Promise<MutationResult>;
  updateStatus: (id: string, status: AppointmentStatus) => Promise<MutationResult>;
  reschedule: (id: string, date: string, time: string) => Promise<MutationResult>;
}

const AppointmentsContext = React.createContext<AppointmentsContextValue | null>(null);

// Shape returned by /api/appointments (Prisma row with customer/staff/service
// included). Decimal fields (price) serialize over JSON as strings, and
// DateTime fields (date) serialize as full ISO datetimes — both get
// normalized back to what the rest of the UI already expects below.
interface AppointmentApiRow {
  id: string;
  customerId: string;
  staffId: string;
  serviceId: string;
  date: string;
  time: string;
  durationMinutes: number;
  price: string | number;
  status: AppointmentStatus;
  notes: string | null;
  customer?: { name: string; phone: string };
  staff?: { name: string };
  service?: { name: string };
}

function toAppointment(row: AppointmentApiRow): Appointment {
  return {
    id: row.id,
    customerId: row.customerId,
    customerName: row.customer?.name ?? "",
    customerPhone: row.customer?.phone ?? "",
    staffId: row.staffId,
    staffName: row.staff?.name ?? "",
    serviceId: row.serviceId,
    serviceName: row.service?.name ?? "",
    date: row.date.slice(0, 10),
    time: row.time,
    durationMinutes: row.durationMinutes,
    price: Number(row.price),
    status: row.status,
    notes: row.notes ?? undefined,
  };
}

async function extractError(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.error ?? fallback;
}

export function AppointmentsProvider({ children }: { children: React.ReactNode }) {
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch("/api/appointments");
      if (!res.ok) throw new Error(await extractError(res, "Failed to load appointments"));
      const rows: AppointmentApiRow[] = await res.json();
      setAppointments(rows.map(toAppointment));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // Inlined directly (rather than calling the `refresh` callback below)
    // because eslint's newer set-state-in-effect rule flags an effect
    // that invokes any function it can trace back to a state setter —
    // even one that only sets state after an await. `refresh` below stays
    // available for a future manual "retry" action from a real event
    // handler, where the same rule doesn't apply.
    fetch("/api/appointments")
      .then(async (res) => {
        if (!res.ok) throw new Error(await extractError(res, "Failed to load appointments"));
        return (await res.json()) as AppointmentApiRow[];
      })
      .then((rows) => {
        setAppointments(rows.map(toAppointment));
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load appointments");
      })
      .finally(() => setLoading(false));
  }, []);

  const addAppointment = React.useCallback(async (input: NewAppointmentInput): Promise<MutationResult> => {
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      return { ok: false, error: await extractError(res, "Couldn't create the appointment.") };
    }
    const row: AppointmentApiRow = await res.json();
    setAppointments((prev) => [...prev, toAppointment(row)]);
    return { ok: true };
  }, []);

  const updateStatus = React.useCallback(async (id: string, status: AppointmentStatus): Promise<MutationResult> => {
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const message = await extractError(res, "Couldn't update the appointment.");
      setError(message);
      return { ok: false, error: message };
    }
    const row: AppointmentApiRow = await res.json();
    setAppointments((prev) => prev.map((a) => (a.id === id ? toAppointment(row) : a)));
    return { ok: true };
  }, []);

  const reschedule = React.useCallback(async (id: string, date: string, time: string): Promise<MutationResult> => {
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, time }),
    });
    if (!res.ok) {
      return { ok: false, error: await extractError(res, "Couldn't reschedule the appointment.") };
    }
    const row: AppointmentApiRow = await res.json();
    setAppointments((prev) => prev.map((a) => (a.id === id ? toAppointment(row) : a)));
    return { ok: true };
  }, []);

  const value = React.useMemo<AppointmentsContextValue>(
    () => ({ appointments, loading, error, refresh, addAppointment, updateStatus, reschedule }),
    [appointments, loading, error, refresh, addAppointment, updateStatus, reschedule]
  );

  return <AppointmentsContext.Provider value={value}>{children}</AppointmentsContext.Provider>;
}

export function useAppointments() {
  const ctx = React.useContext(AppointmentsContext);
  if (!ctx) throw new Error("useAppointments must be used within AppointmentsProvider");
  return ctx;
}
