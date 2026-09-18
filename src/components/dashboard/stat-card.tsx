import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
}) {
  const positive = (trend ?? 0) >= 0;
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ivory">
          <Icon className="h-4 w-4 text-gold-deep" strokeWidth={1.75} />
        </span>
        {trend !== undefined && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              positive ? "text-completed-fg" : "text-cancelled-fg"
            )}
          >
            {positive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink">
        {value}
      </p>
      <p className="mt-1 text-sm text-muted">{label}</p>
      {trendLabel && (
        <p className="mt-0.5 text-xs text-muted-soft">{trendLabel}</p>
      )}
    </Card>
  );
}
