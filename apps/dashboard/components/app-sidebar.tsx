"use client";

import * as React from "react";

import { useParams, usePathname } from "next/navigation";
import { Bot, LifeBuoy, Send, Settings2, SquareTerminal } from "lucide-react";

import Link from "next/link";

import { NavUser } from "@/components/nav-user";
import { NavMain } from "@/components/nav-main";
import { Logo } from "@mailtobills/ui/components/logo";
import { NavSecondary } from "@/components/nav-secondary";

import {
  Sidebar,
  SidebarMenu,
  SidebarFooter,
  SidebarHeader,
  SidebarContent,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@mailtobills/ui/components/sidebar";

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    name?: string;
    email: string;
    avatar: string;
  };
}) {
  const params = useParams<{ month?: string }>();
  const pathname = usePathname();
  const monthParam =
    typeof params.month === "string" ? params.month : undefined;

  const dashboardUrl = monthParam ? `/m/${monthParam}` : "/";
  const reportsUrl = monthParam ? `/m/${monthParam}/reports` : "/reports";

  // Determine which nav item is active based on current pathname
  const isDashboardActive =
    pathname === "/" ||
    pathname === dashboardUrl ||
    (pathname.startsWith("/m/") &&
      !pathname.includes("/reports") &&
      !pathname.includes("/settings"));
  const isReportsActive =
    pathname === "/reports" ||
    pathname === reportsUrl ||
    (pathname.startsWith("/m/") && pathname.includes("/reports"));
  const isSettingsActive = pathname.startsWith("/settings");

  const data = {
    user,
    navMain: [
      {
        title: "Dashboard",
        url: dashboardUrl,
        icon: SquareTerminal,
        isActive: isDashboardActive,
      },
      {
        title: "Reports",
        url: reportsUrl,
        icon: Bot,
        isActive: isReportsActive,
      },
      {
        title: "Settings",
        url: "/settings",
        icon: Settings2,
        isActive: isSettingsActive,
      },
    ],
    navSecondary: [
      {
        title: "Support",
        url: "#",
        icon: LifeBuoy,
      },
      {
        title: "Feedback",
        url: "#",
        icon: Send,
      },
    ],
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={dashboardUrl}>
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  {/* <Command className="size-4" /> */}
                  <Logo className="size-5" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">MailtoBills</span>
                  <span className="truncate text-xs">
                    Expense documents. Organized.
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
