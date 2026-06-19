import { DashboardPageSkeleton } from "@/components/dashboard-page-skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 pt-0">
      <DashboardPageSkeleton />
    </div>
  );
}
