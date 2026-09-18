"use client";

import * as React from "react";
import { MoreHorizontal, Clock, Pencil } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { RescheduleDialog } from "@/components/appointments/reschedule-dialog";
import { initials, formatCurrency } from "@/lib/utils";
import { useAppointments } from "@/lib/appointments-store";
import type { Appointment, AppointmentStatus } from "@/lib/types";

const statusVariant: Record<AppointmentStatus, "pending" | "confirmed" | "completed" | "cancelled"> = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export function AppointmentRow({ appointment }: { appointment: Appointment }) {
  const { updateStatus } = useAppointments();
  const [rescheduleOpen, setRescheduleOpen] = React.useState(false);
  const isFinal = appointment.status === "COMPLETED" || appointment.status === "CANCELLED";

  return (
    <>
      <div className="flex items-center gap-3 rounded-lg border border-line bg-card px-4 py-3">
        <div className="flex w-16 shrink-0 items-center gap-1.5 text-sm font-medium text-ink-soft">
          <Clock className="h-3.5 w-3.5 text-muted-soft" />
          {appointment.time}
        </div>

        <Avatar className="h-9 w-9">
          <AvatarFallback>{initials(appointment.customerName)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{appointment.customerName}</p>
          <p className="truncate text-xs text-muted">
            {appointment.serviceName} · {appointment.staffName} · {appointment.durationMinutes} min
          </p>
        </div>

        <p className="hidden text-sm font-medium text-ink-soft sm:block">
          {formatCurrency(appointment.price)}
        </p>

        <Badge variant={statusVariant[appointment.status]}>
          {appointment.status.toLowerCase()}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isFinal && appointment.status === "CANCELLED"}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {appointment.status === "PENDING" && (
              <DropdownMenuItem onClick={() => updateStatus(appointment.id, "CONFIRMED")}>
                Confirm booking
              </DropdownMenuItem>
            )}
            {appointment.status !== "COMPLETED" && appointment.status !== "CANCELLED" && (
              <DropdownMenuItem onClick={() => updateStatus(appointment.id, "COMPLETED")}>
                Mark completed
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setRescheduleOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Reschedule
            </DropdownMenuItem>
            {!isFinal && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => updateStatus(appointment.id, "CANCELLED")}
                  className="text-cancelled-fg"
                >
                  Cancel booking
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <RescheduleDialog
        appointment={appointment}
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
      />
    </>
  );
}
