import { Download, FileArchive, FileText } from "lucide-react";

import { getExpenseDocuments } from "@/lib/expenseDocuments/getExpenseDocuments";
import { getMonthInfo } from "@/lib/months";
import { Button } from "@mailtobills/ui/components/button";
import { Card, CardContent } from "@mailtobills/ui/components/card";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  const monthInfo = getMonthInfo(month);
  const { summary } = await getExpenseDocuments(monthInfo.value);

  return (
    <Card className="overflow-hidden rounded-[1.75rem] py-0">
      <CardContent className="grid gap-6 p-5 md:grid-cols-[1fr_auto] md:items-center md:p-7">
        <div className="flex gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileArchive className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Accountant export
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">
              {monthInfo.label} export pack
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Download the current primary PDFs and a CSV manifest for collected
              expense documents in this collection month.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 font-medium">
                <FileText className="size-4 text-primary" />
                {summary.count} documents
              </span>
              <span className="rounded-full border bg-background/70 px-3 py-1 font-medium">
                {summary.attachmentCount} PDF attachments
              </span>
            </div>
          </div>
        </div>
        <Button asChild size="lg">
          <a href={`/api/exports/${monthInfo.value}`}>
            <Download className="size-4" />
            Export ZIP
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
