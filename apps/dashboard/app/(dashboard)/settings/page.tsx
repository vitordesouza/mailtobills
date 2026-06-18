import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@mailtobills/convex/_generated/api";

import { CopyField } from "@/components/copy-field";
import { InboxChip } from "@/components/inbox-chip";
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
		<div className="animate-in fade-in space-y-5 duration-300">
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
				<div className="flex flex-col gap-1 text-sm">
					<span className="font-medium">{user?.name ?? "User"}</span>
					<span className="text-muted-foreground">
						{user?.email ?? "No email on file"}
					</span>
				</div>
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
	);
}
