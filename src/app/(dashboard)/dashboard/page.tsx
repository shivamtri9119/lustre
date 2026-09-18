"use client";

import { useSession } from "next-auth/react";
import { IndianRupee, CalendarCheck, Users, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { StaffPerformance } from "@/components/dashboard/staff-performance";
import { UpcomingAppointments } from "@/components/dashboard/upcoming-appointments";
import { useAppointments } from "@/lib/appointments-store";
import { dashboardStats } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const { appointments, loading } = useAppointments();
  const { data: session } = useSession();

  // Was `const TODAY = "2026-06-25"` — a fixed string. That meant "Today's
  // bookings/revenue" only ever matched appointments dated exactly that
  // one day, permanently, regardless of when the dashboard was actually
  // opened. Computed here instead, so it's actually today.
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const todayLabel = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const todays = appointments
    .filter((a) => a.date === todayIso && a.status !== "CANCELLED")
    .sort((a, b) => a.time.localeCompare(b.time));

  // Previously fell back to a static mock number (`dashboardStats.todayRevenue`)
  // whenever nothing matched — which, given the date bug above, was always.
  // With the date fixed, an empty result is usually just an accurate "no
  // completed appointments yet today", so it's shown as ₹0 rather than a
  // fake placeholder.
  const todaysRevenue = todays
    .filter((a) => a.status === "COMPLETED")
    .reduce((sum, a) => sum + a.price, 0);

  // NOTE: "Active customers" and "Monthly earnings" below still read from
  // the static `dashboardStats` mock — those depend on Invoices/Customers
  // having their own real API + aggregation, which is the next slice after
  // this one (see the summary). Only the two cards derived from `appointments`
  // (now live) are real.

  return (
    <div>
      <PageHeader
        title={`Good to see you, ${(session?.user?.name ?? "").split(" ")[0]}`}
        description={`${todayLabel} · ${session?.user?.salonName ?? "Lustre"}`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's revenue"
          value={loading ? "…" : formatCurrency(todaysRevenue)}
          icon={IndianRupee}
          trend={dashboardStats.monthGrowthPct}
          trendLabel="vs. same time yesterday"
        />
        <StatCard
          label="Today's bookings"
          value={loading ? "…" : String(todays.length)}
          icon={CalendarCheck}
          trendLabel={`${todays.filter((a) => a.status === "CONFIRMED").length} confirmed`}
        />
        <StatCard
          label="Active customers"
          value={dashboardStats.activeCustomers.toLocaleString("en-IN")}
          icon={Users}
          trend={4.1}
          trendLabel="last 30 days"
        />
        <StatCard
          label="Monthly earnings"
          value={formatCurrency(dashboardStats.monthlyEarnings)}
          icon={TrendingUp}
          trend={dashboardStats.monthGrowthPct}
          trendLabel="vs. last month"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <StaffPerformance />
      </div>

      <div className="mt-4">
        <UpcomingAppointments appointments={todays} />
      </div>
    </div>
  );
}
