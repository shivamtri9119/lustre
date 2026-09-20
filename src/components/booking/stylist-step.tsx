"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials, colorFromId } from "@/lib/utils";
import type { PublicService, PublicStaff } from "@/lib/types";

export function StylistStep({
  salonSlug,
  service,
  onSelect,
}: {
  salonSlug: string;
  service: PublicService;
  onSelect: (staff: PublicStaff) => void;
}) {
  const [staff, setStaff] = useState<PublicStaff[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(
      `/api/public/staff?salon=${encodeURIComponent(salonSlug)}&serviceId=${encodeURIComponent(service.id)}`
    )
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) setStaff(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [salonSlug, service.id]);

  if (error) {
    return (
      <p className="rounded-lg border border-dashed border-line py-10 text-center text-sm text-muted">
        Couldn&apos;t load stylists right now. Please refresh, or call us to book.
      </p>
    );
  }

  if (!staff) {
    return (
      <p className="rounded-lg border border-dashed border-line py-10 text-center text-sm text-muted">
        Loading stylists…
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {staff.map((s) => (
        <Card
          key={s.id}
          className="flex cursor-pointer items-center gap-3 p-4 transition-all hover:border-gold-deep hover:shadow-md"
          onClick={() => onSelect(s)}
        >
          <Avatar className="h-11 w-11">
            <AvatarFallback style={{ background: colorFromId(s.id), color: "#fff" }}>
              {initials(s.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-display text-sm font-semibold text-ink">{s.name}</p>
            <p className="text-xs text-muted">{s.role}</p>
          </div>
          <span className="flex items-center gap-1 text-xs text-muted">
            <Star className="h-3 w-3 fill-gold text-gold" />
            {s.rating}
          </span>
        </Card>
      ))}
      {staff.length === 0 && (
        <p className="col-span-2 rounded-lg border border-dashed border-line py-10 text-center text-sm text-muted">
          No stylists currently available for this service.
        </p>
      )}
    </div>
  );
}
