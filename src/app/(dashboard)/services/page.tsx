"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { NewServiceDialog } from "@/components/services/new-service-dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { services as seedServices, staff } from "@/lib/mock-data";
import { initials, formatCurrency } from "@/lib/utils";
import type { Service } from "@/lib/types";

export default function ServicesPage() {
  const [services, setServices] = React.useState<Service[]>(seedServices);

  function addService(service: Omit<Service, "id">) {
    setServices((prev) => [...prev, { ...service, id: `svc_${Date.now()}` }]);
  }

  function removeService(id: string) {
    setServices((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div>
      <PageHeader
        title="Services"
        description="Pricing, duration, and staff assignment for everything you offer."
        actions={<NewServiceDialog onCreate={addService} />}
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Assigned staff</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium text-ink">{s.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{s.category}</Badge>
                </TableCell>
                <TableCell className="text-muted">{s.durationMinutes} min</TableCell>
                <TableCell className="font-medium text-ink-soft">{formatCurrency(s.price)}</TableCell>
                <TableCell>
                  <div className="flex -space-x-2">
                    {s.assignedStaffIds.map((id) => {
                      const member = staff.find((st) => st.id === id);
                      if (!member) return null;
                      return (
                        <Avatar key={id} className="h-7 w-7 border-2 border-card">
                          <AvatarFallback
                            className="text-[10px]"
                            style={{ background: member.avatarColor, color: "#fff" }}
                          >
                            {initials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                      );
                    })}
                    {s.assignedStaffIds.length === 0 && (
                      <span className="text-xs text-muted-soft">Unassigned</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => removeService(s.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted hover:text-cancelled-fg" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
