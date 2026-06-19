import { ExpenseDocumentsTableSkeleton } from "@/features/expense-documents/components/expense-documents-table-skeleton";
import { Skeleton } from "@mailtobills/ui/components/skeleton";

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

export function DashboardPageSkeleton({
  includeTable = false,
}: {
  includeTable?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-5"
      role="status"
      aria-label="Loading dashboard"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-full rounded-md md:w-40" />
      </div>
      <div className="divide-border bg-card grid grid-cols-1 divide-y overflow-hidden rounded-lg border shadow-xs sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <StatTileSkeleton />
        <StatTileSkeleton />
        <StatTileSkeleton />
      </div>
      {includeTable ? <ExpenseDocumentsTableSkeleton /> : null}
      <span className="sr-only">Loading dashboard content</span>
    </div>
  );
}
