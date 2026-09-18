"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  format,
  parseISO,
  isSameDay,
  isSameMonth,
  isToday,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/lib/types";

export function MonthlyView({
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
  const monthStart = startOfMonth(parseISO(date));
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });

  const days: Date[] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onDateChange(format(addMonths(monthStart, -1), "yyyy-MM-dd"))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onDateChange(format(addMonths(monthStart, 1), "yyyy-MM-dd"))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <p className="ml-2 font-display text-sm font-semibold text-ink">
          {format(monthStart, "MMMM yyyy")}
        </p>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-line bg-line text-xs font-medium uppercase tracking-wide text-muted">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="bg-ivory px-2 py-2 text-center">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const iso = format(day, "yyyy-MM-dd");
          const count = appointments.filter(
            (a) => isSameDay(parseISO(a.date), day) && a.status !== "CANCELLED"
          ).length;
          const inMonth = isSameMonth(day, monthStart);

          return (
            <button
              key={iso}
              onClick={() => onSelectDay(iso)}
              className={cn(
                "flex h-20 flex-col items-center justify-start gap-1.5 bg-card p-2 transition-colors hover:bg-ivory",
                !inMonth && "bg-bg text-muted-soft",
                isToday(day) && "ring-1 ring-inset ring-gold-deep"
              )}
            >
              <span
                className={cn(
                  "font-display text-sm",
                  inMonth ? "text-ink" : "text-muted-soft"
                )}
              >
                {format(day, "d")}
              </span>
              {count > 0 && (
                <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-medium text-gold-deep">
                  {count} booked
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
