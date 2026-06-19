import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@mailtobills/convex/_generated/api";

import { AppearanceSetting } from "@/components/appearance-setting";
import { CopyField } from "@/components/copy-field";
import { InboxChip } from "@/components/inbox-chip";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@mailtobills/ui/components/avatar";
import { Badge } from "@mailtobills/ui/components/badge";
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@mailtobills/ui/components/page-header";
import { SectionLabel } from "@mailtobills/ui/components/section-label";
import { Separator } from "@mailtobills/ui/components/separator";
import { SidebarTrigger } from "@mailtobills/ui/components/sidebar";

const getInitials = (name?: string, email?: string) => {
  const source = name?.trim() || email?.split("@")[0] || "";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("");
  return initials.toUpperCase() || "U";
};

function SettingsRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="bg-card rounded-lg border shadow-xs">
      <div className="space-y-0.5 border-b px-4 py-3 md:px-5">
        <SectionLabel withRule={false} className="text-foreground">
          {title}
        </SectionLabel>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const token = await convexAuthNextjsToken();
  const user = await fetchQuery(api.users.viewer, {}, { token });

  return (
    <>
      <header className="border-border mb-4 flex h-14 w-full min-w-0 shrink-0 items-center gap-2 border-b">
        <div className="flex w-full min-w-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-1 data-[orientation=vertical]:h-4"
          />
          <span className="text-sm font-medium">Settings</span>
          <Separator
            orientation="vertical"
            className="mx-1 hidden data-[orientation=vertical]:h-4 sm:block"
          />
          <InboxChip className="hidden sm:inline-flex" />
        </div>
      </header>
      <div className="animate-in fade-in mx-auto w-full max-w-3xl min-w-0 flex-1 space-y-5 p-4 pt-0 duration-300">
        <PageHeader>
          <PageHeaderContent>
            <PageHeaderTitle>Settings</PageHeaderTitle>
            <PageHeaderDescription>
              Manage your account and how MailToBills collects your expense
              documents.
            </PageHeaderDescription>
          </PageHeaderContent>
        </PageHeader>

        <SettingsRow
          title="Collection Address"
          description="Forward expense PDFs to this address from your trusted email."
        >
          <CopyField
            id="settings-collection-address"
            label="Your inbox"
            value="inbox@mailtobills.com"
          />
        </SettingsRow>

        <SettingsRow
          title="Account"
          description="The email you sign in with. Forwards are accepted from trusted senders on this account."
        >
          <div className="flex items-center gap-3">
            <Avatar className="size-10 rounded-lg">
              <AvatarImage src={user?.image ?? ""} alt={user?.name ?? "User"} />
              <AvatarFallback className="bg-muted rounded-lg text-xs font-semibold">
                {getInitials(user?.name, user?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">
                {user?.name ?? "User"}
              </span>
              <span className="text-muted-foreground truncate text-sm">
                {user?.email ?? "No email on file"}
              </span>
            </div>
          </div>
        </SettingsRow>

        <SettingsRow
          title="Appearance"
          description="Choose how MailToBills looks on this device."
        >
          <AppearanceSetting />
        </SettingsRow>

        <SettingsRow
          title="Billing"
          description="Plans and invoices for your MailToBills subscription."
        >
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="info">Coming soon</Badge>
            <span className="text-muted-foreground">
              Billing management will appear here once plans launch.
            </span>
          </div>
        </SettingsRow>
      </div>
    </>
  );
}
