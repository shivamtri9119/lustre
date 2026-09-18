"use client";

import * as React from "react";
import { Users, TrendingUp, Wallet, Gauge } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StaffCard } from "@/components/staff/staff-card";
import { staff as seedStaff } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import type { Staff } from "@/lib/types";

export default function StaffPage() {
  const [staff, setStaff] = React.useState<Staff[]>(seedStaff);

  function toggleStatus(id: string) {
    setStaff((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: s.status === "ACTIVE" ? "ON_LEAVE" : "ACTIVE" } : s
      )
    );
  }

  const activeToday = staff.filter((s) => s.status === "ACTIVE").length;
  const avgUtilization = Math.round(
    staff.reduce((sum, s) => sum + s.utilization, 0) / staff.length
  );
  const totalCommission = staff.reduce(
    (sum, s) => sum + Math.round(s.revenueGenerated * (s.commissionRate / 100)),
    0
  );

  return (
    <div>
      <PageHeader
        title="Staff"
        description="Attendance, performance, and commission at a glance."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total staff" value={String(staff.length)} icon={Users} />
        <StatCard label="Active today" value={String(activeToday)} icon={Gauge} />
        <StatCard label="Avg. utilization" value={`${avgUtilization}%`} icon={TrendingUp} />
        <StatCard label="Commission payable" value={formatCurrency(totalCommission)} icon={Wallet} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {staff.map((s) => (
          <StaffCard key={s.id} staff={s} onToggleStatus={toggleStatus} />
        ))}
      </div>
    </div>
  );
}
