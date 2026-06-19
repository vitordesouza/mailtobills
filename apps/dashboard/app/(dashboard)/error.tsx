"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@mailtobills/ui/components/button";
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@mailtobills/ui/components/empty-state";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col p-4 pt-0">
      <EmptyState>
        <EmptyStateIcon>
          <AlertTriangle />
        </EmptyStateIcon>
        <EmptyStateTitle>Could not load this page</EmptyStateTitle>
        <EmptyStateDescription>
          MailToBills could not retrieve the latest dashboard data. Your
          collected Expense Documents have not been changed.
        </EmptyStateDescription>
        <EmptyStateActions>
          <Button type="button" onClick={reset} typography="mono">
            <RotateCcw />
            Try again
          </Button>
        </EmptyStateActions>
      </EmptyState>
    </div>
  );
}
