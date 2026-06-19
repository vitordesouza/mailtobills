import { CalendarX } from "lucide-react";
import Link from "next/link";

import { getMonthInfo } from "@/lib/months";
import { Button } from "@mailtobills/ui/components/button";
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@mailtobills/ui/components/empty-state";

export default function CollectionMonthNotFound() {
  const currentMonth = getMonthInfo();

  return (
    <EmptyState>
      <EmptyStateIcon>
        <CalendarX />
      </EmptyStateIcon>
      <EmptyStateTitle>Collection Month not found</EmptyStateTitle>
      <EmptyStateDescription>
        Use a Collection Month in YYYY-MM format to browse collected Expense
        Documents.
      </EmptyStateDescription>
      <EmptyStateActions>
        <Button asChild typography="mono">
          <Link href={`/m/${currentMonth.value}`}>
            Open {currentMonth.label}
          </Link>
        </Button>
      </EmptyStateActions>
    </EmptyState>
  );
}
