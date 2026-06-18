import { Download, FileArchive, Inbox, Paperclip } from "lucide-react";

import { getExpenseDocuments } from "@/lib/expenseDocuments/getExpenseDocuments";
import { percentDelta } from "@/lib/expenseDocuments/transform";
import { getMonthInfo } from "@/lib/months";
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

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  const monthInfo = getMonthInfo(month);
  const { summary, previousSummary, exportSummary, previousExportSummary } =
    await getExpenseDocuments(monthInfo.value);

  const previousShortLabel = getMonthInfo(
    monthInfo.previous,
  ).start.toLocaleString("en-US", { month: "short" });
  const vsPrevious = `VS ${previousShortLabel}`;

  return (
    <div className="animate-in fade-in space-y-5 duration-300">
      <PageHeader>
        <PageHeaderContent className="space-y-2">
          <SectionLabel>Accountant Export</SectionLabel>
          <PageHeaderTitle className="text-3xl">
            {monthInfo.label}
          </PageHeaderTitle>
          <PageHeaderDescription>
            Download the current primary PDFs and a CSV manifest for collected
            expense documents in this collection month.
          </PageHeaderDescription>
        </PageHeaderContent>
        <Button asChild typography="mono" className="w-full md:w-auto">
          <a href={`/api/exports/${monthInfo.value}`}>
            <Download className="size-4" />
            Export ZIP
          </a>
        </Button>
      </PageHeader>

      <StatGroup variant="row">
        <StatTile>
          <StatTileHeader>
            <StatLabel>Documents</StatLabel>
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
            <StatLabel>Files in Export</StatLabel>
            <FileArchive />
          </StatTileHeader>
          <StatValue className="text-3xl">{exportSummary.fileCount}</StatValue>
          <StatTileFooter>
            <TrendChip
              delta={percentDelta(
                exportSummary.fileCount,
                previousExportSummary.fileCount,
              )}
            />
            <StatTilePeriod>{vsPrevious}</StatTilePeriod>
          </StatTileFooter>
        </StatTile>
      </StatGroup>

      <section className="bg-card space-y-3 rounded-lg border p-4 shadow-xs md:p-5">
        <SectionLabel>What is inside the ZIP</SectionLabel>
        <ul className="text-muted-foreground space-y-1.5 text-sm">
          <li>
            One PDF for each collected document with a Primary Attachment.
          </li>
          <li>
            A CSV manifest with sender, subject, received date, and filename
            for every included document.
          </li>
          {exportSummary.skippedDocumentCount > 0 ? (
            <li>
              {exportSummary.skippedDocumentCount} collected document
              {exportSummary.skippedDocumentCount === 1 ? "" : "s"} without a
              Primary Attachment{" "}
              {exportSummary.skippedDocumentCount === 1 ? "is" : "are"} not
              included.
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
