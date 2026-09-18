import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import type { Appointment, AppointmentStatus } from "@/lib/types";

const statusVariant: Record<AppointmentStatus, "pending" | "confirmed" | "completed" | "cancelled"> = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export function UpcomingAppointments({ appointments }: { appointments: Appointment[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming today</CardTitle>
        <CardDescription>Next bookings across all stylists</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {appointments.length === 0 && (
          <p className="py-6 text-center text-sm text-muted">Nothing else scheduled today.</p>
        )}
        {appointments.map((apt) => (
          <div
            key={apt.id}
            className="flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-ivory"
          >
            <Avatar className="h-9 w-9">
              <AvatarFallback>{initials(apt.customerName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{apt.customerName}</p>
              <p className="truncate text-xs text-muted">
                {apt.serviceName} · with {apt.staffName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-ink-soft">{apt.time}</p>
              <Badge variant={statusVariant[apt.status]} className="mt-1">
                {apt.status.toLowerCase()}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
