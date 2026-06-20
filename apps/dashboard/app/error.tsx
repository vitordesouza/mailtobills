"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@mailtobills/ui/components/button";
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@mailtobills/ui/components/empty-state";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Error");

  useEffect(() => {
    console.error("Application route failed", {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return (
    <main
      id="main-content"
      className="bg-background flex min-h-svh items-center justify-center p-4"
    >
      <EmptyState>
        <EmptyStateIcon>
          <AlertTriangle />
        </EmptyStateIcon>
        <EmptyStateTitle>{t("title")}</EmptyStateTitle>
        <EmptyStateDescription>{t("description")}</EmptyStateDescription>
        <EmptyStateActions>
          <Button type="button" onClick={reset} typography="mono">
            <RotateCcw />
            {t("retry")}
          </Button>
        </EmptyStateActions>
      </EmptyState>
    </main>
  );
}
