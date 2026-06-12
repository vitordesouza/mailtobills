"use client";

import * as React from "react";

import { useParams, usePathname } from "next/navigation";
import {
  Archive,
  Download,
  Inbox,
  LifeBuoy,
  Send,
  Settings2,
} from "lucide-react";

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
        icon: Inbox,
        isActive: isDashboardActive,
      },
      {
        title: "Exports",
        url: reportsUrl,
        icon: Download,
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
    <Sidebar variant="inset" className="border-sidebar-border/70" {...props}>
      <SidebarHeader className="px-3 pt-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="h-12 rounded-2xl border border-sidebar-border/70 bg-card/65 shadow-[0_1px_0_oklch(1_0_0/70%)_inset]"
            >
              <Link href={dashboardUrl}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-xl bg-[oklch(0.42_0.16_230)] text-white shadow-sm">
                  <Logo className="size-5 text-white" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold tracking-[-0.02em]">
                    MailToBills
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/58">
                    Inbox to accountant-ready
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
        <div className="mt-auto rounded-2xl border border-sidebar-border/70 bg-card/55 p-2 shadow-[0_1px_0_oklch(1_0_0/60%)_inset]">
          <div className="mb-2 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45">
            <Archive className="size-3.5" />
            Quiet ops
          </div>
          <NavSecondary items={data.navSecondary} />
        </div>
      </SidebarContent>
      <SidebarFooter className="px-3 pb-3">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
