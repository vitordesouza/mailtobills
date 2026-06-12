import * as React from "react";

import { cn } from "@mailtobills/ui/lib/utils";

function SectionLabel({
  withRule = true,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { withRule?: boolean }) {
  return (
    <div
      data-slot="section-label"
      className={cn(
        "text-muted-foreground flex items-center gap-3 font-mono text-[11px] font-medium tracking-[0.08em] uppercase",
        className,
      )}
      {...props}
    >
      <span className="flex shrink-0 items-center gap-1.5 [&>svg]:size-3.5">
        {children}
      </span>
      {withRule ? <span aria-hidden className="bg-border h-px flex-1" /> : null}
    </div>
  );
}

export { SectionLabel };
