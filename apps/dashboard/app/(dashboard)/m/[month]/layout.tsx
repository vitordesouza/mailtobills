import { redirect } from "next/navigation";

import { getMonthInfo } from "@/lib/months";
import { InboxChip } from "@/components/inbox-chip";
import { MonthNavigator } from "@/components/month-navigator";
import { MonthPageTitle } from "@/components/month-page-title";
import {
  MonthRouteLoadingOverlay,
  NavigationProgressProvider,
} from "@/components/navigation-progress";
import { Separator } from "@mailtobills/ui/components/separator";
import { SidebarTrigger } from "@mailtobills/ui/components/sidebar";

export default async function MonthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  const monthInfo = getMonthInfo(month);

  if (monthInfo.value !== month) {
    redirect(`/m/${monthInfo.value}`);
  }

  return (
    <NavigationProgressProvider>
      <header className="border-border mb-4 flex h-14 w-full min-w-0 shrink-0 items-center gap-2 border-b">
        <div className="flex w-full min-w-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-1 data-[orientation=vertical]:h-4"
          />
          <MonthPageTitle />
          <Separator
            orientation="vertical"
            className="mx-1 hidden data-[orientation=vertical]:h-4 sm:block"
          />
          <InboxChip className="hidden sm:inline-flex" />
          <div className="ml-auto">
            <MonthNavigator />
          </div>
        </div>
      </header>
      <div className="relative flex min-w-0 flex-1 flex-col gap-4 p-4 pt-0">
        <MonthRouteLoadingOverlay />
        {children}
      </div>
    </NavigationProgressProvider>
  );
}
