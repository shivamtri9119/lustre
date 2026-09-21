"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Users, TrendingUp, Wallet, Gauge, Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StaffCard } from "@/components/staff/staff-card";
import { StaffDialog, type StaffInput } from "@/components/staff/staff-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { StaffMember } from "@/lib/types";

type DialogState = null | "new" | StaffMember;

// The salon's real team — read from and saved to the database. The monthly
// numbers are worked out from this salon's actual appointments.
export default function StaffPage() {
  const { data: session } = useSession();
  const isOwner = session?.user?.role === "OWNER";

  const [staff, setStaff] = React.useState<StaffMember[] | null>(null);
  const [services, setServices] = React.useState<{ id: string; name: string }[]>([]);
  const [loadError, setLoadError] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [dialog, setDialog] = React.useState<DialogState>(null);

  // Bumping this re-runs the fetch below (after a save, toggle or delete).
  const [reloadKey, setReloadKey] = React.useState(0);
  const load = React.useCallback(() => setReloadKey((k) => k + 1), []);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([fetch("/api/staff"), fetch("/api/services")])
      .then(async ([staffRes, svcRes]) => {
        if (!staffRes.ok || !svcRes.ok) throw new Error();
        const [stf, svc] = await Promise.all([staffRes.json(), svcRes.json()]);
        if (cancelled) return;
        setStaff(stf);
        setServices(svc);
        setLoadError(false);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  async function request(url: string, method: string, body?: unknown): Promise<string | null> {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }).catch(() => null);
    if (!res) return "Couldn't reach the server. Check your connection and try again.";
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return data?.error ?? "Something went wrong. Please try again.";
    }
    load();
    return null;
  }

  async function saveMember(id: string | null, input: StaffInput) {
    return request(id ? `/api/staff/${id}` : "/api/staff", id ? "PATCH" : "POST", input);
  }

  async function toggleStatus(member: StaffMember) {
    setActionError(null);
    const problem = await request(`/api/staff/${member.id}`, "PATCH", {
      status: member.status === "ACTIVE" ? "ON_LEAVE" : "ACTIVE",
    });
    if (problem) setActionError(problem);
  }

  async function removeMember(member: StaffMember) {
    if (!window.confirm(`Remove ${member.name}? This can't be undone.`)) return;
    setActionError(null);
    const problem = await request(`/api/staff/${member.id}`, "DELETE");
    if (problem) setActionError(problem);
  }

  const list = staff ?? [];
  const activeToday = list.filter((s) => s.status === "ACTIVE").length;
  const bookingsThisMonth = list.reduce((sum, s) => sum + s.bookingsThisMonth, 0);
  const totalCommission = list.reduce(
    (sum, s) => sum + Math.round(s.revenueGenerated * (s.commissionRate / 100)),
    0
  );

  return (
    <div>
      <PageHeader
        title="Staff"
        description="Your team, what each person performs, and this month's bookings and commission."
        actions={
          isOwner ? (
            <Button variant="gold" onClick={() => setDialog("new")}>
              <Plus className="h-4 w-4" />
              Add staff
            </Button>
          ) : undefined
        }
      />

      {actionError && (
        <p className="mb-4 rounded-md border border-cancelled-fg/30 bg-cancelled-bg px-3 py-2 text-sm text-cancelled-fg">
          {actionError}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total staff" value={staff ? String(list.length) : "…"} icon={Users} />
        <StatCard label="Active today" value={staff ? String(activeToday) : "…"} icon={Gauge} />
        <StatCard label="Bookings this month" value={staff ? String(bookingsThisMonth) : "…"} icon={TrendingUp} />
        <StatCard label="Commission payable" value={staff ? formatCurrency(totalCommission) : "…"} icon={Wallet} />
      </div>

      {loadError ? (
        <Card className="mt-6 px-6 py-12 text-center text-sm text-muted">
          Couldn&apos;t load your staff. Refresh the page to try again.
        </Card>
      ) : staff === null ? (
        <Card className="mt-6 px-6 py-12 text-center text-sm text-muted">Loading…</Card>
      ) : list.length === 0 ? (
        <Card className="mt-6 px-6 py-12 text-center">
          <p className="font-display text-base font-semibold text-ink">No staff yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Add your stylists and tick which services each one performs. Customers pick from them when
            they book, on your online booking page or at the front desk.
          </p>
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <StaffCard
              key={s.id}
              staff={s}
              canEdit={isOwner}
              onEdit={setDialog}
              onToggleStatus={toggleStatus}
              onRemove={removeMember}
            />
          ))}
        </div>
      )}

      {dialog && (
        <StaffDialog
          key={dialog === "new" ? "new" : dialog.id}
          member={dialog === "new" ? undefined : dialog}
          services={services}
          onSave={(input) => saveMember(dialog === "new" ? null : dialog.id, input)}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
