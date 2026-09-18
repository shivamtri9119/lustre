import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { initials, formatCurrency } from "@/lib/utils";
import { staff } from "@/lib/mock-data";

export function StaffPerformance() {
  const top = [...staff].sort((a, b) => b.revenueGenerated - a.revenueGenerated);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff performance</CardTitle>
        <CardDescription>Utilization and revenue this month</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {top.map((s) => (
          <div key={s.id}>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback style={{ background: s.avatarColor, color: "#fff" }}>
                  {initials(s.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{s.name}</p>
                <p className="truncate text-xs text-muted">{s.role}</p>
              </div>
              <p className="text-sm font-medium text-ink-soft">
                {formatCurrency(s.revenueGenerated)}
              </p>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Progress value={s.utilization} className="flex-1" />
              <span className="w-9 text-right text-xs text-muted">{s.utilization}%</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
