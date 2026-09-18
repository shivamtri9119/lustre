"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { PublicStaff } from "@/lib/types";

interface Slot {
  value: string;
  label: string;
}

export function TimeStep({
  staff,
  serviceId,
  date,
  onSelect,
}: {
  staff: PublicStaff;
  serviceId: string;
  date: string;
  onSelect: (time: string) => void;
}) {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ serviceId, staffId: staff.id, date });
    fetch(`/api/public/availability?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) setSlots(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [staff.id, serviceId, date]);

  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        Showing only real availability for {staff.name} on this date.
      </p>
      {error ? (
        <p className="rounded-lg border border-dashed border-line py-10 text-center text-sm text-muted">
          Couldn&apos;t load availability right now. Please try another date, or call us.
        </p>
      ) : !slots ? (
        <p className="rounded-lg border border-dashed border-line py-10 text-center text-sm text-muted">
          Checking availability…
        </p>
      ) : slots.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line py-10 text-center text-sm text-muted">
          Fully booked this day — try another date.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {slots.map((slot) => (
            <button
              key={slot.value}
              onClick={() => onSelect(slot.value)}
              className={cn(
                "rounded-lg border border-line bg-card px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-gold-deep hover:bg-ivory hover:text-ink"
              )}
            >
              {slot.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
