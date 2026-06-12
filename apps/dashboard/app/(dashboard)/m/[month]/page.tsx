import { Download, FileText, Inbox, Paperclip } from "lucide-react";

import { getMonthInfo } from "@/lib/months";
import { getExpenseDocuments } from "@/lib/expenseDocuments/getExpenseDocuments";
import { percentDelta } from "@/lib/expenseDocuments/transform";
import { Button } from "@mailtobills/ui/components/button";
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@mailtobills/ui/components/page-header";
import { SectionLabel } from "@mailtobills/ui/components/section-label";
import {
  StatGroup,
  StatLabel,
  StatTile,
  StatTileFooter,
  StatTileHeader,
  StatTilePeriod,
  StatValue,
} from "@mailtobills/ui/components/stat";
import { TrendChip } from "@mailtobills/ui/components/trend-chip";
import { OnboardingEmptyState } from "@/components/onboarding-empty-state";
import { ExpenseDocumentsTable } from "@/components/expense-documents-table";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  const monthInfo = getMonthInfo(month);
  const { summary, previousSummary, totalCount, documents } =
    await getExpenseDocuments(monthInfo.value);

  if (totalCount === 0) {
    return <OnboardingEmptyState />;
  }

  const previousShortLabel = getMonthInfo(
    monthInfo.previous,
  ).start.toLocaleString("en-US", { month: "short" });
  const vsPrevious = `VS ${previousShortLabel}`;

  return (
    <div className="animate-in fade-in space-y-5 duration-300">
      <PageHeader>
        <PageHeaderContent className="space-y-2">
          <SectionLabel>Collection Month</SectionLabel>
          <PageHeaderTitle className="text-3xl">
            {monthInfo.label}
          </PageHeaderTitle>
          <PageHeaderDescription>
            Collected Expense Documents ready for review, download, or
            Accountant Export.
          </PageHeaderDescription>
        </PageHeaderContent>
        <Button asChild typography="mono" className="w-full md:w-auto">
          <a href={`/api/exports/${monthInfo.value}`}>
            <Download className="size-4" />
            Export month
          </a>
        </Button>
      </PageHeader>

      <StatGroup variant="row">
        <StatTile>
          <StatTileHeader>
            <StatLabel>Collected</StatLabel>
            <Inbox />
          </StatTileHeader>
          <StatValue className="text-3xl">{summary.count}</StatValue>
          <StatTileFooter>
            <TrendChip
              delta={percentDelta(summary.count, previousSummary.count)}
            />
            <StatTilePeriod>{vsPrevious}</StatTilePeriod>
          </StatTileFooter>
        </StatTile>
        <StatTile>
          <StatTileHeader>
            <StatLabel>PDF Attachments</StatLabel>
            <Paperclip />
          </StatTileHeader>
          <StatValue className="text-3xl">{summary.attachmentCount}</StatValue>
          <StatTileFooter>
            <TrendChip
              delta={percentDelta(
                summary.attachmentCount,
                previousSummary.attachmentCount,
              )}
            />
            <StatTilePeriod>{vsPrevious}</StatTilePeriod>
          </StatTileFooter>
        </StatTile>
        <StatTile>
          <StatTileHeader>
            <StatLabel>Primary PDFs</StatLabel>
            <FileText className="text-amber-600 dark:text-amber-400" />
          </StatTileHeader>
          <StatValue className="text-3xl">{summary.count}</StatValue>
          <StatTileFooter>
            <TrendChip
              delta={percentDelta(summary.count, previousSummary.count)}
            />
            <StatTilePeriod>{vsPrevious}</StatTilePeriod>
          </StatTileFooter>
        </StatTile>
      </StatGroup>

      <ExpenseDocumentsTable
        documents={documents}
        emptyLabel={`No expense documents collected in ${monthInfo.label}.`}
      />
    </div>
  );
}
