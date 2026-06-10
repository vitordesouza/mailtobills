import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@mailtobills/ui/lib/utils";

function StatGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-group"
      className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}
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
        "text-muted-foreground truncate text-xs font-medium tracking-wide uppercase",
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

export { StatGroup, Stat, StatIcon, StatContent, StatLabel, StatValue };
