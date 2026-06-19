"use client";

import * as React from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  SHORT_MONTH_LABELS,
  buildMonthValue,
  getCurrentMonthValue,
  monthValueParts,
} from "@/lib/months";
import { Button } from "@mailtobills/ui/components/button";
import { cn } from "@mailtobills/ui/lib/utils";

export function MonthPicker({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (monthValue: string) => void;
}) {
  const selected = monthValueParts(value);
  const todayValue = getCurrentMonthValue();
  const today = monthValueParts(todayValue);

  // Year shown in the grid; starts on the selected month's year.
  const [viewYear, setViewYear] = React.useState(selected.year);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Previous year"
          onClick={() => setViewYear((year) => year - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="font-mono text-sm font-medium tracking-[0.08em] tabular-nums">
          {viewYear}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Next year"
          onClick={() => setViewYear((year) => year + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {SHORT_MONTH_LABELS.map((label, index) => {
          const month = index + 1;
          const isSelected =
            viewYear === selected.year && month === selected.month;
          const isCurrent = viewYear === today.year && month === today.month;

          return (
            <button
              key={label}
              type="button"
              onClick={() => onSelect(buildMonthValue(viewYear, month))}
              aria-current={isSelected ? "true" : undefined}
              className={cn(
                "focus-visible:ring-ring/50 relative inline-flex h-9 items-center justify-center rounded-md font-mono text-xs font-medium tracking-[0.06em] uppercase transition-colors outline-none focus-visible:ring-[3px]",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground text-foreground",
              )}
            >
              {label}
              {isCurrent && !isSelected ? (
                <span className="bg-primary absolute bottom-1 size-1 rounded-full" />
              ) : null}
            </button>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        typography="mono"
        className="w-full"
        disabled={value === todayValue}
        onClick={() => onSelect(todayValue)}
      >
        This month
      </Button>
    </div>
  );
}
