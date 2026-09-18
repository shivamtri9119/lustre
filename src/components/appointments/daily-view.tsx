"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppointmentRow } from "@/components/appointments/appointment-row";
import type { Appointment } from "@/lib/types";

export function DailyView({
  appointments,
  date,
  onDateChange,
}: {
  appointments: Appointment[];
  date: string;
  onDateChange: (date: string) => void;
}) {
  const dayAppointments = appointments
    .filter((a) => a.date === date)
    .sort((a, b) => a.time.localeCompare(b.time));

  const shift = (days: number) =>
    onDateChange(format(addDays(parseISO(date), days), "yyyy-MM-dd"));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => shift(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => shift(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <p className="ml-2 font-display text-sm font-semibold text-ink">
            {format(parseISO(date), "EEEE, d MMMM yyyy")}
          </p>
        </div>
        <Input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-auto"
        />
      </div>

      <div className="space-y-2">
        {dayAppointments.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line py-12 text-center text-sm text-muted">
            No appointments on this day.
          </p>
        ) : (
          dayAppointments.map((apt) => <AppointmentRow key={apt.id} appointment={apt} />)
        )}
      </div>
    </div>
  );
}
