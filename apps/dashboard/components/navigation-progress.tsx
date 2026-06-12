"use client";

import * as React from "react";

import { usePathname, useRouter } from "next/navigation";

import { ExpenseDocumentsTableSkeleton } from "@/components/expense-documents-table";
import { Skeleton } from "@mailtobills/ui/components/skeleton";

type NavigationProgressContextValue = {
  navigate: (href: string) => void;
  isNavigating: boolean;
  showOverlay: boolean;
};

const NavigationProgressContext =
  React.createContext<NavigationProgressContextValue | null>(null);

export function NavigationProgressProvider({
  children,
  delayMs = 500,
}: {
  children: React.ReactNode;
  delayMs?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [isNavigating, setIsNavigating] = React.useState(false);
  const [showOverlay, setShowOverlay] = React.useState(false);
  const timerRef = React.useRef<number | null>(null);

  const clearTimer = React.useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const navigate = React.useCallback(
    (href: string) => {
      setIsNavigating(true);
      setShowOverlay(false);

      clearTimer();
      timerRef.current = window.setTimeout(() => {
        setShowOverlay(true);
      }, delayMs);

      router.push(href);
    },
    [clearTimer, delayMs, router]
  );

  React.useEffect(() => {
    setIsNavigating(false);
    setShowOverlay(false);
    clearTimer();
  }, [clearTimer, pathname]);

  React.useEffect(() => clearTimer, [clearTimer]);

  return (
    <NavigationProgressContext.Provider
      value={{ navigate, isNavigating, showOverlay }}
    >
      {children}
    </NavigationProgressContext.Provider>
  );
}

export function useNavigationProgress() {
  const value = React.useContext(NavigationProgressContext);
  if (!value) {
    throw new Error(
      "useNavigationProgress must be used within NavigationProgressProvider"
    );
  }
  return value;
}

function StatTileSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-3 p-4 md:p-5">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="size-3.5 rounded-sm" />
      </div>
      <Skeleton className="h-8 w-12" />
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

export function MonthRouteLoadingOverlay() {
  const { showOverlay } = useNavigationProgress();
  if (!showOverlay) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="bg-background/50 absolute inset-0 backdrop-blur-[2px]" />
      <div className="relative flex flex-col gap-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <Skeleton className="h-9 w-full rounded-md md:w-40" />
        </div>
        <div className="divide-border bg-card grid grid-cols-1 divide-y overflow-hidden rounded-xl border shadow-xs sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <StatTileSkeleton />
          <StatTileSkeleton />
          <StatTileSkeleton />
        </div>
        <ExpenseDocumentsTableSkeleton />
      </div>
    </div>
  );
}
