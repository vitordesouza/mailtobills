import { Download, FileArchive, Inbox, Paperclip } from "lucide-react";

import { getExpenseDocuments } from "@/lib/expenseDocuments/getExpenseDocuments";
import { getMonthInfo } from "@/lib/months";
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

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  const monthInfo = getMonthInfo(month);
  const { summary } = await getExpenseDocuments(monthInfo.value);

  return (
    <div className="animate-in fade-in space-y-4 duration-300">
      <section className="bg-card overflow-hidden rounded-lg border shadow-xs">
        <PageHeader className="p-4 md:p-5">
          <PageHeaderContent>
            <PageHeaderEyebrow>Accountant Export</PageHeaderEyebrow>
            <PageHeaderTitle>{monthInfo.label}</PageHeaderTitle>
            <PageHeaderDescription>
              Download the current primary PDFs and a CSV manifest for
              collected expense documents in this collection month.
            </PageHeaderDescription>
          </PageHeaderContent>
          <Button asChild className="w-full md:w-auto">
            <a href={`/api/exports/${monthInfo.value}`}>
              <Download className="size-4" />
              Export ZIP
            </a>
          </Button>
        </PageHeader>
        <StatGroup className="bg-muted/30 border-t p-4 md:p-5">
          <Stat>
            <StatIcon tone="neutral">
              <Inbox />
            </StatIcon>
            <StatContent>
              <StatLabel>Documents</StatLabel>
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
              <FileArchive />
            </StatIcon>
            <StatContent>
              <StatLabel>Files in export</StatLabel>
              <StatValue>{summary.count + 1}</StatValue>
            </StatContent>
          </Stat>
        </StatGroup>
      </section>
      <section className="bg-card rounded-lg border p-4 shadow-xs md:p-5">
        <h2 className="text-sm font-semibold">What is inside the ZIP</h2>
        <ul className="text-muted-foreground mt-2 space-y-1.5 text-sm">
          <li>
            One PDF per collected document — the attachment currently marked as
            Primary.
          </li>
          <li>
            A CSV manifest with sender, subject, received date, and filename
            for every document.
          </li>
        </ul>
      </section>
    </div>
  );
}
