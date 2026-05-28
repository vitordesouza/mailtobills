import type { ReactNode } from "react";

import { FileText, Mail, Paperclip } from "lucide-react";

import { getMonthInfo } from "@/lib/months";
import { getInvoices } from "@/lib/invoices/getInvoices";
import { Button } from "@mailtobills/ui/components/button";
import { Card, CardContent } from "@mailtobills/ui/components/card";
import { OnboardingEmptyState } from "@/components/onboarding-empty-state";
import { InvoicesTable } from "@/components/invoices-table";

function SummaryCard({
  icon,
  title,
  value,
  action,
  className,
  iconClassName,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  action?: ReactNode;
  className?: string;
  iconClassName: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`flex size-11 items-center justify-center rounded-xl ${iconClassName}`}
          >
            {icon}
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground text-sm">{title}</div>
            <div className="text-3xl font-semibold leading-none">{value}</div>
          </div>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  const monthInfo = getMonthInfo(month);
  const { summary, totalCount, invoices } = await getInvoices(monthInfo.value);

  if (totalCount === 0) {
    return <OnboardingEmptyState />;
  }

  return (
    <>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <SummaryCard
          title="Documents collected"
          value={summary.count}
          icon={<Mail className="size-5" />}
          iconClassName="bg-primary/10 text-primary"
          className="md:col-span-1"
        />
        <SummaryCard
          title="PDF attachments"
          value={summary.attachmentCount}
          icon={<Paperclip className="size-5" />}
          iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-500"
          className="md:col-span-1"
        />
        <SummaryCard
          title="Primary PDFs"
          value={summary.count}
          icon={<FileText className="size-5" />}
          iconClassName="bg-primary/10 text-primary"
          action={
            <Button asChild type="button">
              <a href={`/api/exports/${monthInfo.value}`}>Export month</a>
            </Button>
          }
          className="md:col-span-1"
        />
      </div>
      <InvoicesTable
        invoices={invoices}
        emptyLabel={`No expense documents collected in ${monthInfo.label}.`}
      />
    </>
  );
}
