"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { revenueTrend } from "@/lib/mock-data";

export function RevenueChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue this week</CardTitle>
        <CardDescription>Daily revenue across all services and staff</CardDescription>
      </CardHeader>
      <CardContent className="pl-0">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={revenueTrend} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#E7E4DD" />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#6B6B6B", fontSize: 12 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#6B6B6B", fontSize: 12 }}
              tickFormatter={(v) => `₹${v / 1000}k`}
              width={48}
            />
            <Tooltip
              formatter={(value) => [
                `₹${Number(value ?? 0).toLocaleString("en-IN")}`,
                "Revenue",
              ]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #E7E4DD",
                fontSize: 13,
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#AD8A26"
              strokeWidth={2}
              fill="url(#revenueFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
