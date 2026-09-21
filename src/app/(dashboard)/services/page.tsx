"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ServiceDialog, type ServiceInput } from "@/components/services/new-service-dialog";
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
import { initials, formatCurrency, colorFromId } from "@/lib/utils";
import type { Service } from "@/lib/types";

interface StaffOption {
  id: string;
  name: string;
}

// The salon's real service menu — read from and saved to the database, the
// same data the public booking page and the New Appointment dialog use.
export default function ServicesPage() {
  const { data: session } = useSession();
  const isOwner = session?.user?.role === "OWNER";

  const [services, setServices] = React.useState<Service[] | null>(null);
  const [staff, setStaff] = React.useState<StaffOption[]>([]);
  const [loadError, setLoadError] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  // Bumping this re-runs the fetch below (after a save or delete).
  const [reloadKey, setReloadKey] = React.useState(0);
  const load = React.useCallback(() => setReloadKey((k) => k + 1), []);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([fetch("/api/services"), fetch("/api/staff")])
      .then(async ([svcRes, staffRes]) => {
        if (!svcRes.ok || !staffRes.ok) throw new Error();
        const [svc, stf] = await Promise.all([svcRes.json(), staffRes.json()]);
        if (cancelled) return;
        setServices(svc);
        setStaff(stf);
        setLoadError(false);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  async function saveService(id: string | null, input: ServiceInput): Promise<string | null> {
    const res = await fetch(id ? `/api/services/${id}` : "/api/services", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).catch(() => null);
    if (!res) return "Couldn't reach the server. Check your connection and try again.";
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return body?.error ?? "Couldn't save the service. Please try again.";
    }
    load();
    return null;
  }

  async function removeService(service: Service) {
    if (!window.confirm(`Delete "${service.name}"? This can't be undone.`)) return;
    setActionError(null);
    const res = await fetch(`/api/services/${service.id}`, { method: "DELETE" }).catch(() => null);
    if (!res || !res.ok) {
      const body = await res?.json().catch(() => null);
      setActionError(body?.error ?? "Couldn't delete that service. Please try again.");
      return;
    }
    load();
  }

  const staffById = new Map(staff.map((s) => [s.id, s]));
  const notBookable = (services ?? []).filter((s) => s.assignedStaffIds.length === 0).length;

  return (
    <div>
      <PageHeader
        title="Services"
        description="Pricing, duration, and staff assignment for everything you offer."
        actions={
          isOwner ? (
            <ServiceDialog
              staff={staff}
              onSave={(input) => saveService(null, input)}
              trigger={
                <Button variant="gold">
                  <Plus className="h-4 w-4" />
                  Add service
                </Button>
              }
            />
          ) : undefined
        }
      />

      {actionError && (
        <p className="mb-4 rounded-md border border-cancelled-fg/30 bg-cancelled-bg px-3 py-2 text-sm text-cancelled-fg">
          {actionError}
        </p>
      )}

      {notBookable > 0 && (
        <p className="mb-4 rounded-md border border-pending-fg/30 bg-pending-bg px-3 py-2 text-sm text-pending-fg">
          {notBookable === 1 ? "1 service has" : `${notBookable} services have`} no staff assigned, so
          customers can&apos;t book {notBookable === 1 ? "it" : "them"} online yet. Assign at least one
          staff member.
        </p>
      )}

      <Card>
        {loadError ? (
          <p className="px-6 py-12 text-center text-sm text-muted">
            Couldn&apos;t load your services. Refresh the page to try again.
          </p>
        ) : services === null ? (
          <p className="px-6 py-12 text-center text-sm text-muted">Loading…</p>
        ) : services.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="font-display text-base font-semibold text-ink">No services yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted">
              Add what you offer — haircut, facial, colour — with a price and duration. Add your
              staff too, and customers can start booking through your online booking page.
            </p>
          </div>
        ) : (
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
                        const member = staffById.get(id);
                        if (!member) return null;
                        return (
                          <Avatar key={id} className="h-7 w-7 border-2 border-card" title={member.name}>
                            <AvatarFallback
                              className="text-[10px]"
                              style={{ background: colorFromId(id), color: "#fff" }}
                            >
                              {initials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                        );
                      })}
                      {s.assignedStaffIds.length === 0 && (
                        <Badge variant="pending">Not bookable — no staff</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {isOwner && (
                      <div className="flex justify-end gap-1">
                        <ServiceDialog
                          service={s}
                          staff={staff}
                          onSave={(input) => saveService(s.id, input)}
                          trigger={
                            <Button variant="ghost" size="icon" aria-label={`Edit ${s.name}`}>
                              <Pencil className="h-3.5 w-3.5 text-muted hover:text-ink" />
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${s.name}`}
                          onClick={() => removeService(s)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted hover:text-cancelled-fg" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
