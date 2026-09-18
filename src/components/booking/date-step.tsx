"use client";

import { addDays, format } from "date-fns";
import { cn } from "@/lib/utils";

export function DateStep({
  onSelect,
}: {
  onSelect: (date: string) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
      {days.map((day) => {
        const iso = format(day, "yyyy-MM-dd");
        return (
          <button
            key={iso}
            onClick={() => onSelect(iso)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border border-line bg-card px-3 py-4 transition-colors hover:border-gold-deep hover:bg-ivory"
            )}
          >
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              {format(day, "EEE")}
            </span>
            <span className="font-display text-lg font-semibold text-ink">{format(day, "d")}</span>
            <span className="text-[11px] text-muted-soft">{format(day, "MMM")}</span>
          </button>
        );
      })}
    </div>
  );
}
