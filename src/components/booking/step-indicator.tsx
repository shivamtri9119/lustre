import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = ["Service", "Stylist", "Date", "Time", "Confirm"];

export function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-3">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const done = stepNum < current;
        const active = stepNum === current;
        return (
          <div key={label} className="flex items-center gap-1.5 sm:gap-3">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  done && "bg-gold text-ink",
                  active && "bg-ink text-white",
                  !done && !active && "bg-ivory text-muted-soft"
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : stepNum}
              </span>
              <span
                className={cn(
                  "hidden text-[11px] font-medium sm:block",
                  active ? "text-ink" : "text-muted-soft"
                )}
              >
                {label}
              </span>
            </div>
            {stepNum < steps.length && (
              <span
                className={cn(
                  "h-px w-6 sm:w-12",
                  done ? "bg-gold" : "bg-line"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
