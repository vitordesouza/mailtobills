"use client";

import * as React from "react";

import { useParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChartColumn, LayoutDashboard, Settings2 } from "lucide-react";

import Link from "next/link";

import { NavUser } from "@/components/nav-user";
import { NavMain } from "@/components/nav-main";
import { Logo } from "@mailtobills/ui/components/logo";

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
  const t = useTranslations("Navigation");
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
        title: t("dashboard"),
        url: dashboardUrl,
        icon: LayoutDashboard,
        isActive: isDashboardActive,
      },
      {
        title: t("reports"),
        url: reportsUrl,
        icon: ChartColumn,
        isActive: isReportsActive,
      },
      {
        title: t("settings"),
        url: "/settings",
        icon: Settings2,
        isActive: isSettingsActive,
      },
    ],
  };

  return (
    <Sidebar
      variant="inset"
      mobileTitle={t("sidebarTitle")}
      mobileDescription={t("sidebarDescription")}
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="border-sidebar-border bg-background hover:bg-background border shadow-xs group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:shadow-none"
            >
              <Link href={dashboardUrl}>
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 shrink-0 items-center justify-center rounded-md">
                  <Logo className="size-5" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-medium">
                    MailToBills
                  </span>
                  <span className="text-muted-foreground truncate font-mono text-[10px] font-medium tracking-[0.08em] uppercase">
                    {t("customer")}
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
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
