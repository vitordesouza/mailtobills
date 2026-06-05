import type { ReactNode } from "react";

import { Download, FileText, Inbox, Paperclip } from "lucide-react";

import { getMonthInfo } from "@/lib/months";
import { getExpenseDocuments } from "@/lib/expenseDocuments/getExpenseDocuments";
import { Button } from "@mailtobills/ui/components/button";
import { OnboardingEmptyState } from "@/components/onboarding-empty-state";
import { ExpenseDocumentsTable } from "@/components/expense-documents-table";

function MetricBlock({
  icon,
  title,
  value,
  iconClassName,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  iconClassName: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${iconClassName}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-muted-foreground truncate text-xs font-medium uppercase">
          {title}
        </div>
        <div className="text-2xl font-semibold leading-none tracking-tight">
          {value}
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  const monthInfo = getMonthInfo(month);
  const { summary, totalCount, documents } = await getExpenseDocuments(
    monthInfo.value,
  );

  if (totalCount === 0) {
    return <OnboardingEmptyState />;
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-lg border bg-card shadow-xs">
        <div className="grid gap-6 p-4 md:grid-cols-[1fr_auto] md:items-center md:p-5">
          <div className="min-w-0 space-y-1">
            <p className="text-muted-foreground text-xs font-medium uppercase">
              Collection Month
            </p>
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {monthInfo.label}
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm">
              Collected Expense Documents ready for review, download, or
              Accountant Export.
            </p>
          </div>
          <Button asChild type="button" className="w-full md:w-auto">
            <a href={`/api/exports/${monthInfo.value}`}>
              <Download className="size-4" />
              Export month
            </a>
          </Button>
        </div>
        <div className="grid gap-4 border-t bg-muted/20 p-4 lg:grid-cols-3 md:p-5">
          <MetricBlock
            title="Collected"
            value={summary.count}
            icon={<Inbox className="size-5" />}
            iconClassName="bg-background text-foreground"
          />
          <MetricBlock
            title="PDF attachments"
            value={summary.attachmentCount}
            icon={<Paperclip className="size-5" />}
            iconClassName="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400"
          />
          <MetricBlock
            title="Primary PDFs"
            value={summary.count}
            icon={<FileText className="size-5" />}
            iconClassName="bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400"
          />
        </div>
      </section>
      <ExpenseDocumentsTable
        documents={documents}
        emptyLabel={`No expense documents collected in ${monthInfo.label}.`}
      />
    </div>
  );
}
