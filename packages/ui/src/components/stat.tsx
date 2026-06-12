import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@mailtobills/ui/lib/utils";

const statGroupVariants = cva("", {
  variants: {
    variant: {
      grid: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
      row: "divide-border bg-card grid grid-cols-1 divide-y overflow-hidden rounded-xl border shadow-xs sm:grid-cols-3 sm:divide-x sm:divide-y-0",
    },
  },
  defaultVariants: {
    variant: "grid",
  },
});

function StatGroup({
  className,
  variant = "grid",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof statGroupVariants>) {
  return (
    <div
      data-slot="stat-group"
      data-variant={variant}
      className={cn(statGroupVariants({ variant, className }))}
      {...props}
    />
  );
}

function Stat({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat"
      className={cn("flex min-w-0 items-center gap-3", className)}
      {...props}
    />
  );
}

const statIconVariants = cva(
  "flex size-10 shrink-0 items-center justify-center rounded-lg border [&>svg]:size-5",
  {
    variants: {
      tone: {
        neutral: "bg-background text-foreground",
        success:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/15 dark:text-emerald-400",
        warning:
          "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-400/15 dark:text-amber-400",
        info: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:border-sky-400/15 dark:text-sky-400",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

function StatIcon({
  className,
  tone = "neutral",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof statIconVariants>) {
  return (
    <div
      data-slot="stat-icon"
      data-tone={tone}
      className={cn(statIconVariants({ tone, className }))}
      {...props}
    />
  );
}

function StatContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-content"
      className={cn("min-w-0 space-y-1", className)}
      {...props}
    />
  );
}

function StatLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-label"
      className={cn(
        "text-muted-foreground truncate font-mono text-[11px] font-medium tracking-[0.08em] uppercase",
        className,
      )}
      {...props}
    />
  );
}

function StatValue({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-value"
      className={cn(
        "text-2xl leading-none font-semibold tracking-tight tabular-nums",
        className,
      )}
      {...props}
    />
  );
}

/* Aster-style tile, used inside StatGroup variant="row" */
function StatTile({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-tile"
      className={cn("flex min-w-0 flex-col gap-3 p-4 md:p-5", className)}
      {...props}
    />
  );
}

function StatTileHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-tile-header"
      className={cn(
        "text-muted-foreground flex items-center justify-between gap-2 [&>svg]:size-3.5 [&>svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

function StatTileFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-tile-footer"
      className={cn(
        "mt-auto flex items-center justify-between gap-2",
        className,
      )}
      {...props}
    />
  );
}

function StatTilePeriod({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="stat-tile-period"
      className={cn(
        "text-muted-foreground rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-[0.08em] whitespace-nowrap uppercase",
        className,
      )}
      {...props}
    />
  );
}

export {
  StatGroup,
  Stat,
  StatIcon,
  StatContent,
  StatLabel,
  StatValue,
  StatTile,
  StatTileHeader,
  StatTileFooter,
  StatTilePeriod,
};
