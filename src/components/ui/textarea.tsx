import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-20 w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink placeholder:text-muted-soft transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:border-gold-deep",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
