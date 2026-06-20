import { Download, FileArchive, Inbox, Paperclip } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { getExpenseDocuments } from "@/features/expense-documents/read-model/getExpenseDocuments";
import { percentDelta } from "@/features/expense-documents/read-model/transform";
import { formatCollectionMonthLabel } from "@/lib/localized-format";
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
import { getCollectionMonthRoute } from "@/lib/collection-month-route";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  const monthInfo = getCollectionMonthRoute(month);
  const [
    { summary, previousSummary, exportSummary, previousExportSummary },
    locale,
    t,
  ] = await Promise.all([
    getExpenseDocuments(monthInfo.value),
    getLocale(),
    getTranslations("Reports"),
  ]);

  const previousShortLabel = formatCollectionMonthLabel(
    getMonthInfo(monthInfo.previous).start,
    locale,
    "short",
  );
  const monthLabel = formatCollectionMonthLabel(monthInfo.start, locale);
  const vsPrevious = t("stats.vsPrevious", { month: previousShortLabel });

  return (
    <div className="animate-in fade-in space-y-5 duration-300">
      <PageHeader>
        <PageHeaderContent className="space-y-2">
          <SectionLabel>{t("sectionLabel")}</SectionLabel>
          <PageHeaderTitle className="text-3xl">
            {monthLabel}
          </PageHeaderTitle>
          <PageHeaderDescription>
            {t("description")}
          </PageHeaderDescription>
        </PageHeaderContent>
        <Button asChild typography="mono" className="w-full md:w-auto">
          <a href={`/api/exports/${monthInfo.value}`}>
            <Download className="size-4" />
            {t("exportZip")}
          </a>
        </Button>
      </PageHeader>

      <StatGroup variant="row">
        <StatTile>
          <StatTileHeader>
            <StatLabel>{t("stats.documents")}</StatLabel>
            <Inbox />
          </StatTileHeader>
          <StatValue className="text-3xl">{summary.count}</StatValue>
          <StatTileFooter>
            <TrendChip
              delta={percentDelta(summary.count, previousSummary.count)}
              newLabel={t("stats.new")}
            />
            <StatTilePeriod>{vsPrevious}</StatTilePeriod>
          </StatTileFooter>
        </StatTile>
        <StatTile>
          <StatTileHeader>
            <StatLabel>{t("stats.pdfAttachments")}</StatLabel>
            <Paperclip />
          </StatTileHeader>
          <StatValue className="text-3xl">{summary.attachmentCount}</StatValue>
          <StatTileFooter>
            <TrendChip
              delta={percentDelta(
                summary.attachmentCount,
                previousSummary.attachmentCount,
              )}
              newLabel={t("stats.new")}
            />
            <StatTilePeriod>{vsPrevious}</StatTilePeriod>
          </StatTileFooter>
        </StatTile>
        <StatTile>
          <StatTileHeader>
            <StatLabel>{t("stats.filesInExport")}</StatLabel>
            <FileArchive />
          </StatTileHeader>
          <StatValue className="text-3xl">{exportSummary.fileCount}</StatValue>
          <StatTileFooter>
            <TrendChip
              delta={percentDelta(
                exportSummary.fileCount,
                previousExportSummary.fileCount,
              )}
              newLabel={t("stats.new")}
            />
            <StatTilePeriod>{vsPrevious}</StatTilePeriod>
          </StatTileFooter>
        </StatTile>
      </StatGroup>

      <section className="bg-card space-y-3 rounded-lg border p-4 shadow-xs md:p-5">
        <SectionLabel>{t("zipContents.title")}</SectionLabel>
        <ul className="text-muted-foreground space-y-1.5 text-sm">
          <li>{t("zipContents.primaryPdfs")}</li>
          <li>{t("zipContents.manifest")}</li>
          {exportSummary.skippedDocumentCount > 0 ? (
            <li>
              {t("zipContents.skipped", {
                count: exportSummary.skippedDocumentCount,
              })}
            </li>
          ) : null}
          <li>{t("zipContents.estimate")}</li>
        </ul>
      </section>
    </div>
  );
}
