import * as React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { cn } from "@mailtobills/ui/lib/utils";

/**
 * Month-over-month delta chip. `delta` is a signed number; `null` means
 * there is no prior data to compare against (rendered as "NEW").
 */
function TrendChip({
  delta,
  format = "percent",
  positiveIsGood = true,
  newLabel = "New",
  className,
  ...props
}: React.ComponentProps<"span"> & {
  delta: number | null;
  format?: "percent" | "count";
  positiveIsGood?: boolean;
  newLabel?: string;
}) {
  if (delta === null) {
    return (
      <span
        data-slot="trend-chip"
        className={cn(
          "text-muted-foreground inline-flex items-center gap-1 font-mono text-[11px] font-medium tracking-[0.08em] uppercase",
          className,
        )}
        {...props}
      >
        {newLabel}
      </span>
    );
  }

  if (delta === 0) {
    return (
      <span
        data-slot="trend-chip"
        className={cn(
          "text-muted-foreground inline-flex items-center gap-1 font-mono text-[11px] tabular-nums",
          className,
        )}
        {...props}
      >
        <span className="bg-muted text-muted-foreground flex size-4 items-center justify-center rounded-full">
          <Minus className="size-2.5" />
        </span>
        0{format === "percent" ? "%" : ""}
      </span>
    );
  }

  const isUp = delta > 0;
  const isGood = positiveIsGood ? isUp : !isUp;
  const magnitude = Math.abs(delta);
  const value =
    format === "percent"
      ? `${magnitude >= 100 ? Math.round(magnitude) : magnitude.toFixed(1)}%`
      : `${Math.round(magnitude)}`;

  return (
    <span
      data-slot="trend-chip"
      data-direction={isUp ? "up" : "down"}
      className={cn(
        "inline-flex items-center gap-1 font-mono text-[11px] font-medium tabular-nums",
        isGood ? "text-primary" : "text-destructive",
        className,
      )}
      {...props}
    >
      {value}
      <span
        className={cn(
          "flex size-4 items-center justify-center rounded-full",
          isGood
            ? "bg-primary text-primary-foreground"
            : "bg-destructive text-destructive-foreground",
        )}
      >
        {isUp ? (
          <ArrowUpRight className="size-2.5" />
        ) : (
          <ArrowDownRight className="size-2.5" />
        )}
      </span>
    </span>
  );
}

export { TrendChip };
