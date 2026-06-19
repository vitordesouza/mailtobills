"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

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
  useEffect(() => {
    console.error("Application route failed", {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return (
    <main className="bg-background flex min-h-svh items-center justify-center p-4">
      <EmptyState>
        <EmptyStateIcon>
          <AlertTriangle />
        </EmptyStateIcon>
        <EmptyStateTitle>Could not load this page</EmptyStateTitle>
        <EmptyStateDescription>
          MailToBills could not retrieve the latest data. Check the page before
          trying the action again.
        </EmptyStateDescription>
        <EmptyStateActions>
          <Button type="button" onClick={reset} typography="mono">
            <RotateCcw />
            Try again
          </Button>
        </EmptyStateActions>
      </EmptyState>
    </main>
  );
}
