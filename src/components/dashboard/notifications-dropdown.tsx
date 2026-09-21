"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, CalendarPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  event: string;
  payload: {
    customerName?: string;
    serviceName?: string;
    staffName?: string;
    date?: string;
    time?: string;
  } | null;
  read: boolean;
  createdAt: string;
}

const POLL_MS = 60_000; // light polling for "a new booking just came in" freshness

export function NotificationsDropdown() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setItems(data.items);
        setUnreadCount(data.unreadCount);
      })
      .catch(() => {
        /* silent — the bell just won't update this cycle, not worth an error UI for a poll */
      });
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, [load]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && unreadCount > 0) {
      // Mark read as soon as they open the list — same convention as
      // every other notification-bell pattern people already know.
      fetch("/api/notifications/read", { method: "POST" }).then(() => setUnreadCount(0));
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-ivory hover:text-ink"
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gold-deep ring-2 ring-card" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>New bookings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted">
            Nothing yet — new online bookings show up here.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {items.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-2.5 px-2 py-2.5 text-sm",
                  !n.read && "bg-ivory"
                )}
              >
                <CalendarPlus className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
                <div className="min-w-0">
                  <p className="text-ink">
                    <span className="font-medium">{n.payload?.customerName ?? "A customer"}</span>{" "}
                    booked {n.payload?.serviceName ?? "a service"} with {n.payload?.staffName ?? "your team"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
