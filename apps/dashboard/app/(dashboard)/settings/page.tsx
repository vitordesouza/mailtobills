import { fetchQuery } from "convex/nextjs";
import { api } from "@mailtobills/convex/_generated/api";
import { getTranslations } from "next-intl/server";

import { BillingSettings } from "@/components/billing-settings";
import { ExportScheduleForm } from "@/components/export-schedule-form";
import { ForwardingAddressesForm } from "@/components/forwarding-addresses-form";
import { PreferencesSettings } from "@/components/preferences-settings";
import { SettingsContextStrip } from "@/components/settings-context-strip";
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@mailtobills/ui/components/page-header";
import { SectionLabel } from "@mailtobills/ui/components/section-label";
import { requireCurrentCustomer } from "@/features/customer/read-model/getCurrentCustomer";

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
  const t = await getTranslations("Settings");
  const { token, customer } = await requireCurrentCustomer();
  const subscription = await fetchQuery(
    api.subscriptions.getMySubscription,
    {},
    { token },
  );

  return (
    <div className="animate-in fade-in space-y-5 duration-300">
      <div className="space-y-3">
        <PageHeader>
          <PageHeaderContent>
            <PageHeaderTitle>{t("title")}</PageHeaderTitle>
            <PageHeaderDescription>{t("description")}</PageHeaderDescription>
          </PageHeaderContent>
        </PageHeader>

        <SettingsContextStrip
          customerName={customer.name}
          customerEmail={customer.email ?? undefined}
          collectionAddress="inbox@mailtobills.com"
        />
      </div>

      <SettingsRow
        title={t("sections.forwardingTitle")}
        description={t("sections.forwardingDescription")}
      >
        <ForwardingAddressesForm
          isPro={customer.plan === "pro"}
          primaryEmail={customer.email ?? undefined}
          forwardingEmails={customer.forwardingAddresses}
        />
      </SettingsRow>

      <SettingsRow
        title={t("sections.deliveryTitle")}
        description={t("sections.deliveryDescription")}
      >
        <ExportScheduleForm
          isPro={customer.plan === "pro"}
          accountantEmail={customer.accountantAddress ?? undefined}
          accountantName={customer.accountantName ?? undefined}
          exportScheduleDay={customer.exportScheduleDay ?? undefined}
        />
      </SettingsRow>

      <SettingsRow
        title={t("sections.billingTitle")}
        description={t("sections.billingDescription")}
      >
        <BillingSettings
          isPro={customer.plan === "pro"}
          subscriptionStatus={subscription?.status}
          currentPeriodEnd={subscription?.currentPeriodEnd}
          proPriceLabel={process.env.LEMONSQUEEZY_PRO_PRICE_LABEL ?? "Pro"}
        />
      </SettingsRow>

      <SettingsRow
        title={t("sections.preferencesTitle")}
        description={t("sections.preferencesDescription")}
      >
        <PreferencesSettings />
      </SettingsRow>
    </div>
  );
}
