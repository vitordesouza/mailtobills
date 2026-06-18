import { InboxChip } from "@/components/inbox-chip";
import { MonthPageTitle } from "@/components/month-page-title";
import { Separator } from "@mailtobills/ui/components/separator";
import { SidebarTrigger } from "@mailtobills/ui/components/sidebar";

import {
	MonthRouteLoadingOverlay,
	NavigationProgressProvider,
} from "@/components/navigation-progress";

export default function SettingsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<NavigationProgressProvider>
			<header className="border-border mb-4 flex h-14 w-full min-w-0 shrink-0 items-center gap-2 border-b">
				<div className="flex w-full min-w-0 items-center gap-2 px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator
						orientation="vertical"
						className="mr-2 data-[orientation=vertical]:h-4"
					/>
					<MonthPageTitle />
					<Separator
						orientation="vertical"
						className="mx-1 hidden data-[orientation=vertical]:h-4 sm:block"
					/>
					<InboxChip className="hidden sm:inline-flex" />
				</div>
			</header>
			<div className="relative flex min-w-0 flex-1 flex-col gap-4 p-4 pt-0">
				<MonthRouteLoadingOverlay />
				{children}
			</div>
		</NavigationProgressProvider>
	);
}
