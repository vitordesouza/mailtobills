import { AppSidebar } from "@/components/app-sidebar";
import { requireCurrentCustomer } from "@/features/customer/read-model/getCurrentCustomer";

import {
  SidebarInset,
  SidebarProvider,
} from "@mailtobills/ui/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { customer } = await requireCurrentCustomer();

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: customer.name,
          email: customer.email ?? "",
          avatar: customer.avatarUrl ?? "",
        }}
      />
      <SidebarInset
        id="main-content"
        tabIndex={-1}
        className="min-w-0 overflow-x-hidden outline-none"
      >
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
