import { Users2, Repeat, TrendingUp, IndianRupee } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  MonthlyRevenueChart,
  ServicePerformanceChart,
  PeakHoursChart,
} from "@/components/analytics/analytics-charts";
import { StaffPerformance } from "@/components/dashboard/staff-performance";
import { dashboardStats, monthlyRevenue } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export default function AnalyticsPage() {
  const latestMonth = monthlyRevenue[monthlyRevenue.length - 1];

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="The numbers an owner checks every morning."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="This month's revenue"
          value={formatCurrency(latestMonth.revenue)}
          icon={IndianRupee}
          trend={dashboardStats.monthGrowthPct}
          trendLabel="vs. previous month"
        />
        <StatCard
          label="Customer retention"
          value={`${dashboardStats.retentionRate}%`}
          icon={Repeat}
          trendLabel="repeat within 60 days"
        />
        <StatCard
          label="Active customers"
          value={dashboardStats.activeCustomers.toLocaleString("en-IN")}
          icon={Users2}
          trend={4.1}
        />
        <StatCard
          label="Avg. growth (6mo)"
          value="+5.8%"
          icon={TrendingUp}
          trendLabel="month over month"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MonthlyRevenueChart />
        <ServicePerformanceChart />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PeakHoursChart />
        </div>
        <StaffPerformance />
      </div>
    </div>
  );
}
