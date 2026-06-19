import { Skeleton } from "@mailtobills/ui/components/skeleton";

function SettingsSectionSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <section className="space-y-5 border-b py-6 first:pt-0 last:border-b-0">
      <div className="space-y-2">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function SettingsLoading() {
  return (
    <div
      className="mx-auto w-full max-w-3xl"
      role="status"
      aria-label="Loading settings"
    >
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <SettingsSectionSkeleton />
      <SettingsSectionSkeleton rows={3} />
      <span className="sr-only">Loading settings</span>
    </div>
  );
}
