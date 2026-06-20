"use client";

import * as React from "react";

import { usePathname, useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import Link from "next/link";

import { getMonthInfo } from "@/lib/months";
import { formatCollectionMonthLabel } from "@/lib/localized-format";
import { toCollectionMonthValue } from "@mailtobills/domain";
import { Button } from "@mailtobills/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@mailtobills/ui/components/popover";
import { Separator } from "@mailtobills/ui/components/separator";
import { cn } from "@mailtobills/ui/lib/utils";

const buildMonthHref = (pathname: string, month: string) => {
  if (pathname.startsWith("/m/")) {
    return pathname.replace(/^\/m\/[^/]+/, `/m/${month}`);
  }

  return `/m/${month}`;
};

const getMonthYear = (month: string) => Number(month.slice(0, 4));

const buildCollectionMonth = (year: number, monthIndex: number) =>
  `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

export const MonthNavigator = () => {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("Navigation");
  const params = useParams<{ month?: string }>();
  const monthParam =
    typeof params.month === "string" ? params.month : undefined;
  const monthInfo = getMonthInfo(monthParam);
  const [isNavigating, startNavigation] = React.useTransition();
  const currentMonth = toCollectionMonthValue(new Date());
  const [isPickerOpen, setIsPickerOpen] = React.useState(false);
  const [visibleYear, setVisibleYear] = React.useState(() =>
    getMonthYear(monthInfo.value),
  );

  const previous2 = getMonthInfo(monthInfo.previous).previous;
  const next2 = getMonthInfo(monthInfo.next).next;

  const previousHref = buildMonthHref(pathname, monthInfo.previous);
  const nextHref = buildMonthHref(pathname, monthInfo.next);
  const previous2Href = buildMonthHref(pathname, previous2);
  const next2Href = buildMonthHref(pathname, next2);
  const currentHref = buildMonthHref(pathname, currentMonth);
  const isCurrentMonth = monthInfo.value === currentMonth;
  const monthLabel = formatCollectionMonthLabel(monthInfo.start, locale);
  const currentMonthLabel = formatCollectionMonthLabel(
    getMonthInfo(currentMonth).start,
    locale,
  );

  const navigateToMonth = (month: string) => {
    if (isNavigating) return;
    setIsPickerOpen(false);
    if (month === monthInfo.value) return;
    startNavigation(() => {
      router.push(buildMonthHref(pathname, month));
    });
  };

  React.useEffect(() => {
    if (!isPickerOpen) {
      setVisibleYear(getMonthYear(monthInfo.value));
    }
  }, [isPickerOpen, monthInfo.value]);

  React.useEffect(() => {
    // Prefetch a small window of months to reduce skeleton flashes when paging quickly.
    for (const href of [
      previousHref,
      nextHref,
      previous2Href,
      next2Href,
      ...(!isCurrentMonth ? [currentHref] : []),
    ]) {
      router.prefetch(href);
    }
  }, [
    router,
    previousHref,
    nextHref,
    previous2Href,
    next2Href,
    currentHref,
    isCurrentMonth,
  ]);

  return (
    <section className="flex items-center gap-2">
      <div className="bg-background flex items-center overflow-hidden rounded-lg border shadow-xs">
        <Link
          prefetch
          href={previousHref}
          aria-label={t("previousMonth")}
          aria-disabled={isNavigating}
          onClick={(event) => {
            if (isNavigating) return;
            event.preventDefault();
            startNavigation(() => {
              router.push(previousHref);
            });
          }}
          className="text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/50 inline-flex h-8 w-8 items-center justify-center transition outline-none focus-visible:ring-[3px] aria-disabled:pointer-events-none aria-disabled:opacity-50"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <Separator orientation="vertical" className="h-8" />
        <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={t("chooseMonth", { month: monthLabel })}
              disabled={isNavigating}
              className="text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/50 inline-flex h-8 items-center gap-1.5 px-3 font-mono text-xs font-medium tracking-[0.06em] uppercase tabular-nums transition outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
            >
              <span className="hidden min-[420px]:inline">
                {monthLabel}
              </span>
              <span className="min-[420px]:hidden">{monthInfo.value}</span>
              <ChevronDown className="text-muted-foreground size-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            aria-label={t("chooseCollectionMonth")}
            className="w-[19.5rem] p-0"
          >
            <div className="flex items-center justify-between gap-3 border-b p-3">
              <button
                type="button"
                aria-label={t("previousYear")}
                disabled={isNavigating}
                onClick={() => setVisibleYear((year) => year - 1)}
                className="text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/50 inline-flex size-8 items-center justify-center rounded-md transition outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
              >
                <ChevronLeft className="size-4" />
              </button>
              <div className="min-w-0 text-center">
                <div className="text-muted-foreground font-mono text-[11px] font-medium tracking-[0.08em] uppercase">
                  {t("jumpTo")}
                </div>
                <div className="font-mono text-sm font-semibold tabular-nums">
                  {visibleYear}
                </div>
              </div>
              <button
                type="button"
                aria-label={t("nextYear")}
                disabled={isNavigating}
                onClick={() => setVisibleYear((year) => year + 1)}
                className="text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/50 inline-flex size-8 items-center justify-center rounded-md transition outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 p-3">
              {Array.from({ length: 12 }, (_, monthIndex) => {
                const month = buildCollectionMonth(visibleYear, monthIndex);
                const isSelected = month === monthInfo.value;
                const isToday = month === currentMonth;
                const buttonMonthInfo = getMonthInfo(month);
                const shortLabel = formatCollectionMonthLabel(
                  buttonMonthInfo.start,
                  locale,
                  "short",
                );
                const accessibleMonth = formatCollectionMonthLabel(
                  buttonMonthInfo.start,
                  locale,
                );
                const accessibleLabel =
                  isToday && !isSelected
                    ? t("monthIsCurrent", { month: accessibleMonth })
                    : accessibleMonth;

                return (
                  <button
                    type="button"
                    key={month}
                    aria-current={isSelected ? "date" : undefined}
                    aria-label={accessibleLabel}
                    disabled={isNavigating}
                    onClick={() => navigateToMonth(month)}
                    className={cn(
                      "focus-visible:ring-ring/50 inline-flex h-9 items-center justify-center rounded-md border bg-background px-2 font-mono text-xs font-semibold tracking-[0.04em] uppercase tabular-nums shadow-xs transition outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50",
                      "hover:bg-accent hover:text-accent-foreground",
                      isSelected &&
                        "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                      isToday &&
                        !isSelected &&
                        "border-amber-600/50 text-amber-700 dark:border-amber-400/50 dark:text-amber-300",
                    )}
                  >
                    {shortLabel}
                  </button>
                );
              })}
            </div>
            {!isCurrentMonth ? (
              <div className="flex justify-end border-t p-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  typography="mono"
                  disabled={isNavigating}
                  onClick={() => navigateToMonth(currentMonth)}
                >
                  <CalendarDays className="size-3.5" />
                  {t("currentMonth")}
                </Button>
              </div>
            ) : null}
          </PopoverContent>
        </Popover>
        <Separator orientation="vertical" className="h-8" />
        <Link
          href={nextHref}
          prefetch
          aria-label={t("nextMonth")}
          aria-disabled={isNavigating}
          onClick={(event) => {
            if (isNavigating) return;
            event.preventDefault();
            startNavigation(() => {
              router.push(nextHref);
            });
          }}
          className="text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/50 inline-flex h-8 w-8 items-center justify-center transition outline-none focus-visible:ring-[3px] aria-disabled:pointer-events-none aria-disabled:opacity-50"
        >
          <ChevronRight className="size-4" />
        </Link>
      </div>
      {!isCurrentMonth ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          typography="mono"
          aria-label={t("goToCurrentMonth", { month: currentMonthLabel })}
          disabled={isNavigating}
          onClick={() => navigateToMonth(currentMonth)}
          className="w-8 px-0 sm:w-auto sm:px-3"
        >
          <CalendarDays className="size-3.5" />
          <span className="hidden sm:inline">{t("currentMonth")}</span>
        </Button>
      ) : null}
    </section>
  );
};
