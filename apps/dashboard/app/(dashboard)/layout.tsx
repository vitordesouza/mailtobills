import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@mailtobills/convex/_generated/api";

import { AppSidebar } from "@/components/app-sidebar";

import {
  SidebarInset,
  SidebarProvider,
} from "@mailtobills/ui/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await convexAuthNextjsToken();
  const user = await fetchQuery(api.users.viewer, {}, { token });

  // Map Convex user to the format expected by AppSidebar
  const userData = user
    ? {
        name: user.name,
        email: user.email || "",
        avatar: user.image || "",
      }
    : {
        name: "User",
        email: "",
        avatar: "",
      };

  return (
    <SidebarProvider>
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,oklch(0.9_0.08_190/55%),transparent_32%),radial-gradient(circle_at_85%_0%,oklch(0.92_0.08_75/48%),transparent_30%),linear-gradient(180deg,oklch(0.982_0.008_84),oklch(0.95_0.01_80))]" />
      <AppSidebar user={userData} />
      <SidebarInset className="min-w-0 overflow-x-hidden bg-transparent">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
