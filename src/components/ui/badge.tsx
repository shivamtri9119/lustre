import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium leading-none",
  {
    variants: {
      variant: {
        default: "bg-ivory text-ink",
        gold: "bg-gold/15 text-gold-deep",
        pending: "bg-pending-bg text-pending-fg",
        confirmed: "bg-confirmed-bg text-confirmed-fg",
        completed: "bg-completed-bg text-completed-fg",
        cancelled: "bg-cancelled-bg text-cancelled-fg",
        outline: "border border-line text-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props} />
  );
}

export { Badge, badgeVariants };
