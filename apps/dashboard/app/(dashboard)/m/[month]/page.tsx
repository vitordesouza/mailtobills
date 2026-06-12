import type { ReactNode } from "react";

import { Download, FileCheck2, FileText, Inbox, Paperclip } from "lucide-react";

import { getMonthInfo } from "@/lib/months";
import { getExpenseDocuments } from "@/lib/expenseDocuments/getExpenseDocuments";
import { Button } from "@mailtobills/ui/components/button";
import { OnboardingEmptyState } from "@/components/onboarding-empty-state";
import { ExpenseDocumentsTable } from "@/components/expense-documents-table";

function MetricBlock({
  icon,
  title,
  value,
  description,
  iconClassName,
}: {
  title: string;
  value: number;
  description: string;
  icon: ReactNode;
  iconClassName: string;
}) {
  return (
    <div className="group rounded-2xl border bg-card/74 p-4 shadow-[0_1px_0_oklch(1_0_0/70%)_inset] transition duration-200 hover:-translate-y-0.5 hover:bg-card">
      <div className="mb-5 flex items-center justify-between">
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${iconClassName}`}
        >
          {icon}
        </div>
        <span className="rounded-full border bg-background/70 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
          This month
        </span>
      </div>
      <div className="text-3xl font-semibold leading-none tracking-[-0.04em]">
        {value}
      </div>
      <div className="mt-2 text-sm font-medium tracking-[-0.01em]">{title}</div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
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
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[1.75rem] border bg-card/86 shadow-[0_1px_0_oklch(1_0_0/75%)_inset,0_24px_70px_oklch(0.18_0.012_258/8%)] backdrop-blur">
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,oklch(0.66_0.12_190),oklch(0.42_0.16_230),oklch(0.76_0.14_76))]" />
        <div className="absolute -right-16 -top-20 size-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="grid gap-8 p-5 md:grid-cols-[1fr_auto] md:items-start md:p-7">
          <div className="min-w-0 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-semibold text-muted-foreground shadow-[0_1px_0_oklch(1_0_0/70%)_inset]">
              <span className="size-1.5 rounded-full bg-[oklch(0.68_0.14_180)]" />
              Live collection
            </div>
            <div className="space-y-2">
              <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                {monthInfo.label} expense inbox
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Forward invoices, bills, faturas and receipts. MailToBills keeps
                the accepted PDFs tidy so the accountant export is one click.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <Button
              asChild
              type="button"
              size="lg"
              className="w-full md:w-auto"
            >
              <a href={`/api/exports/${monthInfo.value}`}>
                <Download className="size-4" />
                Export accountant pack
              </a>
            </Button>
            <p className="text-xs text-muted-foreground">
              ZIP with primary PDFs + CSV manifest
            </p>
          </div>
        </div>
        <div className="grid gap-3 border-t bg-muted/25 p-4 md:grid-cols-3 md:p-5">
          <MetricBlock
            title="Documents collected"
            value={summary.count}
            description="Accepted forwarded emails stored as reviewable rows."
            icon={<Inbox className="size-4" />}
            iconClassName="bg-background text-foreground"
          />
          <MetricBlock
            title="PDF attachments"
            value={summary.attachmentCount}
            description="All invoice-like PDFs kept with their email context."
            icon={<Paperclip className="size-4" />}
            iconClassName="bg-[oklch(0.92_0.06_175)] text-[oklch(0.36_0.1_190)] border-[oklch(0.82_0.08_175)]"
          />
          <MetricBlock
            title="Primary PDFs"
            value={summary.count}
            description="The clean file set used for downloads and exports."
            icon={<FileCheck2 className="size-4" />}
            iconClassName="bg-[oklch(0.94_0.08_78)] text-[oklch(0.48_0.1_70)] border-[oklch(0.84_0.08_78)]"
          />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_20rem]">
        <ExpenseDocumentsTable
          documents={documents}
          emptyLabel={`No expense documents collected in ${monthInfo.label}.`}
        />
        <aside className="space-y-3 rounded-[1.5rem] border bg-card/76 p-4 shadow-[0_1px_0_oklch(1_0_0/70%)_inset] backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Forwarding recipe</h2>
              <p className="text-xs text-muted-foreground">
                Keep it boring and reliable.
              </p>
            </div>
          </div>
          <ol className="space-y-2 text-sm text-muted-foreground">
            {[
              "Forward the email, not a screenshot.",
              "PDF attachments are ranked automatically.",
              "Export when the month is ready for accounting.",
            ].map((item, index) => (
              <li
                key={item}
                className="flex gap-2 rounded-xl bg-background/55 p-2"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                  {index + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
