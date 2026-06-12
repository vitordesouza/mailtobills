import { redirect } from "next/navigation";

import { getMonthInfo } from "@/lib/months";
import { MonthNavigator } from "@/components/month-navigator";
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
      <header className="sticky top-0 z-20 mx-2 mb-4 flex h-16 min-w-0 shrink-0 items-center gap-2 border-b border-border/70 bg-background/72 backdrop-blur-xl supports-[backdrop-filter]:bg-background/62 md:mx-4">
        <div className="flex w-full min-w-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <MonthNavigator />
        </div>
      </header>
      <div className="relative flex min-w-0 flex-1 flex-col gap-5 px-3 pb-4 pt-0 md:px-4 lg:px-6">
        <MonthRouteLoadingOverlay />
        {children}
      </div>
    </NavigationProgressProvider>
  );
}
