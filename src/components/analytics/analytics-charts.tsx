"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { monthlyRevenue, servicePerformance, peakHours } from "@/lib/mock-data";

const axisTick = { fill: "#6B6B6B", fontSize: 12 };
const tooltipStyle = { borderRadius: 8, border: "1px solid #E7E4DD", fontSize: 13 };

export function MonthlyRevenueChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue trend</CardTitle>
        <CardDescription>Last 6 months</CardDescription>
      </CardHeader>
      <CardContent className="pl-0">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={monthlyRevenue} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#E7E4DD" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={axisTick} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={axisTick}
              tickFormatter={(v) => `₹${v / 1000}k`}
              width={48}
            />
            <Tooltip
              formatter={(value) => [`₹${Number(value ?? 0).toLocaleString("en-IN")}`, "Revenue"]}
              contentStyle={tooltipStyle}
            />
            <Line type="monotone" dataKey="revenue" stroke="#AD8A26" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ServicePerformanceChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Best-selling services</CardTitle>
        <CardDescription>Revenue contribution this month</CardDescription>
      </CardHeader>
      <CardContent className="pl-0">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={servicePerformance} layout="vertical" margin={{ top: 10, right: 24, left: 8, bottom: 0 }}>
            <CartesianGrid horizontal={false} stroke="#E7E4DD" />
            <XAxis type="number" tickLine={false} axisLine={false} tick={axisTick} tickFormatter={(v) => `₹${v / 1000}k`} />
            <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={axisTick} width={90} />
            <Tooltip
              formatter={(value) => [`₹${Number(value ?? 0).toLocaleString("en-IN")}`, "Revenue"]}
              contentStyle={tooltipStyle}
            />
            <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
              {servicePerformance.map((_, i) => (
                <Cell key={i} fill={i === 0 ? "#D4AF37" : "#EFE7CF"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function PeakHoursChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Peak business hours</CardTitle>
        <CardDescription>Bookings by hour, last 30 days</CardDescription>
      </CardHeader>
      <CardContent className="pl-0">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={peakHours} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#E7E4DD" />
            <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={axisTick} />
            <YAxis tickLine={false} axisLine={false} tick={axisTick} width={28} />
            <Tooltip formatter={(value) => [value, "Bookings"]} contentStyle={tooltipStyle} />
            <Bar dataKey="bookings" radius={[4, 4, 0, 0]} fill="#111111" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
