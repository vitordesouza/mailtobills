import { Download, FileText, Inbox, Paperclip } from "lucide-react";

import { getMonthInfo } from "@/lib/months";
import { getExpenseDocuments } from "@/lib/expenseDocuments/getExpenseDocuments";
import { Button } from "@mailtobills/ui/components/button";
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderEyebrow,
  PageHeaderTitle,
} from "@mailtobills/ui/components/page-header";
import {
  Stat,
  StatContent,
  StatGroup,
  StatIcon,
  StatLabel,
  StatValue,
} from "@mailtobills/ui/components/stat";
import { OnboardingEmptyState } from "@/components/onboarding-empty-state";
import { ExpenseDocumentsTable } from "@/components/expense-documents-table";

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
    <div className="animate-in fade-in space-y-4 duration-300">
      <section className="bg-card overflow-hidden rounded-lg border shadow-xs">
        <PageHeader className="p-4 md:p-5">
          <PageHeaderContent>
            <PageHeaderEyebrow>Collection Month</PageHeaderEyebrow>
            <PageHeaderTitle>{monthInfo.label}</PageHeaderTitle>
            <PageHeaderDescription>
              Collected Expense Documents ready for review, download, or
              Accountant Export.
            </PageHeaderDescription>
          </PageHeaderContent>
          <Button asChild className="w-full md:w-auto">
            <a href={`/api/exports/${monthInfo.value}`}>
              <Download className="size-4" />
              Export month
            </a>
          </Button>
        </PageHeader>
        <StatGroup className="bg-muted/30 border-t p-4 md:p-5">
          <Stat>
            <StatIcon tone="neutral">
              <Inbox />
            </StatIcon>
            <StatContent>
              <StatLabel>Collected</StatLabel>
              <StatValue>{summary.count}</StatValue>
            </StatContent>
          </Stat>
          <Stat>
            <StatIcon tone="success">
              <Paperclip />
            </StatIcon>
            <StatContent>
              <StatLabel>PDF attachments</StatLabel>
              <StatValue>{summary.attachmentCount}</StatValue>
            </StatContent>
          </Stat>
          <Stat>
            <StatIcon tone="warning">
              <FileText />
            </StatIcon>
            <StatContent>
              <StatLabel>Primary PDFs</StatLabel>
              <StatValue>{summary.count}</StatValue>
            </StatContent>
          </Stat>
        </StatGroup>
      </section>
      <ExpenseDocumentsTable
        documents={documents}
        emptyLabel={`No expense documents collected in ${monthInfo.label}.`}
      />
    </div>
  );
}
