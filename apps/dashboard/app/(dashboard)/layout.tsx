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
      <AppSidebar user={userData} />
      <SidebarInset className="min-w-0 overflow-x-hidden">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
