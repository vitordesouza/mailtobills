"use client";

import * as React from "react";

import { usePathname, useRouter } from "next/navigation";

import { ExpenseDocumentsTableSkeleton } from "@/components/expense-documents-table";
import { Card, CardContent } from "@mailtobills/ui/components/card";
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

function SummaryCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="size-11 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-12" />
          </div>
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </CardContent>
    </Card>
  );
}

export function MonthRouteLoadingOverlay() {
  const { showOverlay } = useNavigationProgress();
  if (!showOverlay) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px]" />
      <div className="relative flex flex-col gap-4">
        <div className="grid auto-rows-min gap-4 md:grid-cols-4">
          <SummaryCardSkeleton className="md:col-span-1" />
          <SummaryCardSkeleton className="md:col-span-1" />
          <SummaryCardSkeleton className="md:col-span-2" />
        </div>
        <ExpenseDocumentsTableSkeleton />
      </div>
    </div>
  );
}
