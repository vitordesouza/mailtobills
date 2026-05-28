import { Download } from "lucide-react";

import { getInvoices } from "@/lib/invoices/getInvoices";
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
  const { summary } = await getInvoices(monthInfo.value);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            Accountant export for {monthInfo.label}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Download the current primary PDFs and a CSV manifest for collected
            expense documents in this collection month.
          </p>
          <p className="text-muted-foreground mt-3 text-sm">
            {summary.count} documents, {summary.attachmentCount} PDF
            attachments
          </p>
        </div>
        <Button asChild>
          <a href={`/api/exports/${monthInfo.value}`}>
            <Download className="size-4" />
            Export ZIP
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
