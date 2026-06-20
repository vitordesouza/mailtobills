"use client";

import { Skeleton } from "@mailtobills/ui/components/skeleton";
import { useTranslations } from "next-intl";

export default function AppLoading() {
  const t = useTranslations("System");

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="bg-background min-h-svh p-4 outline-none sm:p-6"
      role="status"
      aria-label={t("loadingApp")}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex h-14 items-center gap-3 border-b">
          <Skeleton className="size-8" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-8 w-52 max-w-full" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-72" />
      </div>
      <span className="sr-only">{t("loadingApp")}</span>
    </main>
  );
}
