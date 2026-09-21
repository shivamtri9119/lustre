"use client";

import { Star, Clock, MoreHorizontal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { initials, formatCurrency } from "@/lib/utils";
import type { StaffMember } from "@/lib/types";

export function StaffCard({
  staff,
  canEdit,
  onEdit,
  onToggleStatus,
  onRemove,
}: {
  staff: StaffMember;
  canEdit: boolean;
  onEdit: (staff: StaffMember) => void;
  onToggleStatus: (staff: StaffMember) => void;
  onRemove: (staff: StaffMember) => void;
}) {
  const commission = Math.round(staff.revenueGenerated * (staff.commissionRate / 100));
  const serviceCount = staff.assignedServiceIds.length;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11">
            <AvatarFallback style={{ background: staff.avatarColor, color: "#fff" }}>
              {initials(staff.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-display text-sm font-semibold text-ink">{staff.name}</p>
            <p className="text-xs text-muted">{staff.role}</p>
          </div>
        </div>
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for ${staff.name}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(staff)}>Edit details</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStatus(staff)}>
                {staff.status === "ACTIVE" ? "Mark on leave" : "Mark active"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRemove(staff)}>Remove</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        <Badge variant={staff.status === "ACTIVE" ? "confirmed" : "pending"}>
          {staff.status === "ACTIVE" ? "Active today" : "On leave"}
        </Badge>
        <span className="flex items-center gap-1 text-muted">
          <Star className="h-3 w-3 fill-gold text-gold" />
          {staff.rating}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
        <Clock className="h-3.5 w-3.5" />
        {staff.workingHours}
      </div>

      {staff.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {staff.skills.map((skill) => (
            <Badge key={skill} variant="outline">
              {skill}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-3 text-xs">
        {serviceCount === 0 ? (
          <Badge variant="pending">No services assigned — can&apos;t be booked</Badge>
        ) : (
          <span className="text-muted">
            Performs {serviceCount} {serviceCount === 1 ? "service" : "services"}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-3 text-sm">
        <div>
          <p className="text-xs text-muted">Bookings (mo.)</p>
          <p className="font-display font-semibold text-ink">{staff.bookingsThisMonth}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Revenue (mo.)</p>
          <p className="font-display font-semibold text-ink">{formatCurrency(staff.revenueGenerated)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Commission ({staff.commissionRate}%)</p>
          <p className="font-display font-semibold text-ink">{formatCurrency(commission)}</p>
        </div>
      </div>
    </Card>
  );
}
