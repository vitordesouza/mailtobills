"use client";

import * as React from "react";

import { usePathname, useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

import Link from "next/link";

import { getMonthInfo } from "@/lib/months";
import { useNavigationProgress } from "@/components/navigation-progress";
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

  const previous2 = getMonthInfo(monthInfo.previous).previous;
  const next2 = getMonthInfo(monthInfo.next).next;

  const previousHref = buildMonthHref(pathname, monthInfo.previous);
  const nextHref = buildMonthHref(pathname, monthInfo.next);
  const previous2Href = buildMonthHref(pathname, previous2);
  const next2Href = buildMonthHref(pathname, next2);

  React.useEffect(() => {
    for (const href of [previousHref, nextHref, previous2Href, next2Href]) {
      router.prefetch(href);
    }
  }, [router, previousHref, nextHref, previous2Href, next2Href]);

  return (
    <section className="flex w-full min-w-0 items-center gap-3">
      <div className="hidden min-w-0 items-center gap-2 lg:flex">
        <div className="flex size-8 items-center justify-center rounded-xl border bg-card/80 text-primary shadow-[0_1px_0_oklch(1_0_0/70%)_inset]">
          <CalendarDays className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Collection month
          </p>
          <h1 className="truncate text-base font-semibold tracking-[-0.02em] text-foreground">
            {monthInfo.label}
          </h1>
        </div>
      </div>
      <div className="mx-auto flex items-center overflow-hidden rounded-2xl border bg-card/82 p-1 shadow-[0_1px_0_oklch(1_0_0/70%)_inset,0_12px_30px_oklch(0.18_0.012_258/6%)] backdrop-blur lg:mx-0 lg:ml-auto">
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
          className="text-muted-foreground hover:bg-accent/70 hover:text-accent-foreground focus-visible:ring-ring/40 inline-flex h-8 w-8 items-center justify-center rounded-xl transition outline-none focus-visible:ring-[3px] aria-disabled:pointer-events-none aria-disabled:opacity-50"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <Separator orientation="vertical" className="mx-1 h-5" />
        <div className="min-w-[8.5rem] px-3 py-1 text-center text-sm font-semibold tracking-[-0.01em] text-foreground">
          {monthInfo.label}
        </div>
        <Separator orientation="vertical" className="mx-1 h-5" />
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
          className="text-muted-foreground hover:bg-accent/70 hover:text-accent-foreground focus-visible:ring-ring/40 inline-flex h-8 w-8 items-center justify-center rounded-xl transition outline-none focus-visible:ring-[3px] aria-disabled:pointer-events-none aria-disabled:opacity-50"
        >
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </section>
  );
};
