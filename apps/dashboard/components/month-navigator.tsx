"use client";

import * as React from "react";

import { usePathname, useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import Link from "next/link";

import { getMonthInfo } from "@/lib/months";
import { MonthPicker } from "@/components/month-picker";
import { useNavigationProgress } from "@/components/navigation-progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@mailtobills/ui/components/popover";
import { Separator } from "@mailtobills/ui/components/separator";

const buildMonthHref = (pathname: string, month: string) => {
  if (pathname.startsWith("/m/")) {
    return pathname.replace(/^\/m\/[^/]+/, `/m/${month}`);
  }

  return `/m/${month}`;
};

export const MonthNavigator = () => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ month?: string }>();
  const monthParam =
    typeof params.month === "string" ? params.month : undefined;
  const monthInfo = getMonthInfo(monthParam);
  const { navigate, isNavigating } = useNavigationProgress();
  const [isPickerOpen, setIsPickerOpen] = React.useState(false);

  const handlePick = (monthValue: string) => {
    setIsPickerOpen(false);
    if (monthValue === monthInfo.value) return;
    navigate(buildMonthHref(pathname, monthValue));
  };

  const previous2 = getMonthInfo(monthInfo.previous).previous;
  const next2 = getMonthInfo(monthInfo.next).next;

  const previousHref = buildMonthHref(pathname, monthInfo.previous);
  const nextHref = buildMonthHref(pathname, monthInfo.next);
  const previous2Href = buildMonthHref(pathname, previous2);
  const next2Href = buildMonthHref(pathname, next2);

  React.useEffect(() => {
    // Prefetch a small window of months to reduce skeleton flashes when paging quickly.
    for (const href of [previousHref, nextHref, previous2Href, next2Href]) {
      router.prefetch(href);
    }
  }, [router, previousHref, nextHref, previous2Href, next2Href]);

  return (
    <section className="flex items-center">
      <div className="bg-background flex items-center overflow-hidden rounded-lg border shadow-xs">
          <Link
            prefetch
            href={previousHref}
            aria-label="Previous month"
            aria-disabled={isNavigating}
            onClick={(event) => {
              if (isNavigating) return;
              event.preventDefault();
              navigate(previousHref);
            }}
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/50 inline-flex h-8 w-8 items-center justify-center transition outline-none focus-visible:ring-[3px] aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <Separator orientation="vertical" className="h-8" />
          <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
            <PopoverTrigger
              aria-label="Choose month"
              className="text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/50 inline-flex h-8 items-center px-3 py-1 font-mono text-xs font-medium tracking-[0.06em] uppercase tabular-nums transition outline-none focus-visible:ring-[3px] data-[state=open]:bg-accent"
            >
              {monthInfo.label}
            </PopoverTrigger>
            <PopoverContent align="center" className="w-64">
              <MonthPicker value={monthInfo.value} onSelect={handlePick} />
            </PopoverContent>
          </Popover>
          <Separator orientation="vertical" className="h-8" />
          <Link
            href={nextHref}
            prefetch
            aria-label="Next month"
            aria-disabled={isNavigating}
            onClick={(event) => {
              if (isNavigating) return;
              event.preventDefault();
              navigate(nextHref);
            }}
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/50 inline-flex h-8 w-8 items-center justify-center transition outline-none focus-visible:ring-[3px] aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            <ChevronRight className="size-4" />
          </Link>
      </div>
    </section>
  );
};
