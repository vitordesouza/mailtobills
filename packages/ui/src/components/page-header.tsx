import * as React from "react";

import { cn } from "@mailtobills/ui/lib/utils";

function PageHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-header"
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-center md:justify-between",
        className,
      )}
      {...props}
    />
  );
}

function PageHeaderContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-header-content"
      className={cn("min-w-0 space-y-1", className)}
      {...props}
    />
  );
}

function PageHeaderEyebrow({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="page-header-eyebrow"
      className={cn(
        "text-muted-foreground font-mono text-[11px] font-medium tracking-[0.08em] uppercase",
        className,
      )}
      {...props}
    />
  );
}

function PageHeaderTitle({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      data-slot="page-header-title"
      className={cn(
        "truncate text-2xl font-semibold tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

function PageHeaderDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="page-header-description"
      className={cn("text-muted-foreground max-w-2xl text-sm", className)}
      {...props}
    />
  );
}

function PageHeaderActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-header-actions"
      className={cn("flex shrink-0 items-center gap-2", className)}
      {...props}
    />
  );
}

export {
  PageHeader,
  PageHeaderContent,
  PageHeaderEyebrow,
  PageHeaderTitle,
  PageHeaderDescription,
  PageHeaderActions,
};
