"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PublicService } from "@/lib/types";

export function ServiceStep({
  salonSlug,
  onSelect,
}: {
  salonSlug: string;
  onSelect: (service: PublicService) => void;
}) {
  const [services, setServices] = useState<PublicService[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/public/services?salon=${encodeURIComponent(salonSlug)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) setServices(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [salonSlug]);

  if (error) {
    return (
      <p className="rounded-lg border border-dashed border-line py-10 text-center text-sm text-muted">
        Couldn&apos;t load services right now. Please refresh, or call us to book.
      </p>
    );
  }

  if (!services) {
    return (
      <p className="rounded-lg border border-dashed border-line py-10 text-center text-sm text-muted">
        Loading services…
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {services.map((s) => (
        <Card
          key={s.id}
          className={cn(
            "cursor-pointer p-4 transition-all hover:border-gold-deep hover:shadow-md"
          )}
          onClick={() => onSelect(s)}
        >
          <div className="flex items-center justify-between">
            <p className="font-display text-sm font-semibold text-ink">{s.name}</p>
            <span className="rounded-full bg-ivory px-2 py-0.5 text-xs text-muted">
              {s.category}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted">
              <Clock className="h-3.5 w-3.5" />
              {s.durationMinutes} min
            </span>
            <span className="font-display font-semibold text-gold-deep">₹{s.price}</span>
          </div>
        </Card>
      ))}
      {services.length === 0 && (
        <p className="col-span-2 rounded-lg border border-dashed border-line py-10 text-center text-sm text-muted">
          No services are set up yet.
        </p>
      )}
    </div>
  );
}
