"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  startOfWeek,
  addDays,
  format,
  parseISO,
  isSameDay,
  isToday,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/lib/types";

export function WeeklyView({
  appointments,
  date,
  onDateChange,
  onSelectDay,
}: {
  appointments: Appointment[];
  date: string;
  onDateChange: (date: string) => void;
  onSelectDay: (date: string) => void;
}) {
  const weekStart = startOfWeek(parseISO(date), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onDateChange(format(addDays(weekStart, -7), "yyyy-MM-dd"))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onDateChange(format(addDays(weekStart, 7), "yyyy-MM-dd"))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <p className="ml-2 font-display text-sm font-semibold text-ink">
          {format(weekStart, "d MMM")} – {format(addDays(weekStart, 6), "d MMM yyyy")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {days.map((day) => {
          const iso = format(day, "yyyy-MM-dd");
          const dayAppointments = appointments
            .filter((a) => isSameDay(parseISO(a.date), day))
            .sort((a, b) => a.time.localeCompare(b.time));

          return (
            <button
              key={iso}
              onClick={() => onSelectDay(iso)}
              className={cn(
                "flex min-h-[9rem] flex-col rounded-lg border border-line bg-card p-2.5 text-left transition-colors hover:border-gold-deep",
                isToday(day) && "border-gold-deep ring-1 ring-gold/30"
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  {format(day, "EEE")}
                </span>
                <span className="font-display text-sm font-semibold text-ink">
                  {format(day, "d")}
                </span>
              </div>
              <div className="space-y-1">
                {dayAppointments.slice(0, 3).map((apt) => (
                  <div key={apt.id} className="flex items-center gap-1.5 truncate text-xs">
                    <span className="text-muted-soft">{apt.time}</span>
                    <span className="truncate text-ink-soft">{apt.customerName}</span>
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <Badge variant="outline" className="mt-1">
                    +{dayAppointments.length - 3} more
                  </Badge>
                )}
                {dayAppointments.length === 0 && (
                  <p className="text-xs text-muted-soft">—</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
