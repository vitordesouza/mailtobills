import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@mailtobills/convex/_generated/api";

import { BillingSettings } from "@/components/billing-settings";
import { CopyField } from "@/components/copy-field";
import { ForwardingAddressesForm } from "@/components/forwarding-addresses-form";
import {
	PageHeader,
	PageHeaderContent,
	PageHeaderDescription,
	PageHeaderTitle,
} from "@mailtobills/ui/components/page-header";
import { SectionLabel } from "@mailtobills/ui/components/section-label";

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
	const subscription = await fetchQuery(
		api.subscriptions.getMySubscription,
		{},
		{ token },
	);

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
				title="Forwarding Addresses"
				description="Control which email addresses can send Expense Documents to your account."
			>
				<ForwardingAddressesForm
					isPro={Boolean(user?.isPro)}
					primaryEmail={user?.email ?? undefined}
					forwardingEmails={user?.forwardingEmails ?? []}
				/>
			</SettingsRow>

			<SettingsRow
				title="Billing"
				description="Plans and invoices for your MailToBills subscription."
			>
				<BillingSettings
					isPro={Boolean(user?.isPro)}
					subscriptionStatus={subscription?.status}
					currentPeriodEnd={subscription?.currentPeriodEnd}
					proPriceLabel={process.env.LEMONSQUEEZY_PRO_PRICE_LABEL ?? "Pro"}
				/>
			</SettingsRow>
		</div>
	);
}
