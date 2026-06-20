import { useTranslations } from "next-intl";

import { SectionLabel } from "@mailtobills/ui/components/section-label";
import {
  TableHead,
  TableHeader,
  TableRow,
} from "@mailtobills/ui/components/table";
import { cn } from "@mailtobills/ui/lib/utils";

export function ExpenseDocumentsTableColumns() {
  return (
    <colgroup>
      <col className="w-[52px]" />
      <col className="w-[220px]" />
      <col />
      <col className="w-[150px]" />
      <col className="w-[120px]" />
      <col className="w-[190px]" />
    </colgroup>
  );
}

export function ExpenseDocumentsTableHeading({ count }: { count?: number }) {
  const t = useTranslations("ExpenseDocuments.table");

  return (
    <div className="bg-card flex flex-col gap-1 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0 space-y-0.5">
        <SectionLabel withRule={false} className="text-foreground">
          {t("title")}
        </SectionLabel>
        <p className="text-muted-foreground text-xs">
          {t("description")}
        </p>
      </div>
      {count !== undefined ? (
        <div className="text-muted-foreground font-mono text-[11px] font-medium tracking-[0.08em] uppercase tabular-nums">
          {t("count", { count })}
        </div>
      ) : null}
    </div>
  );
}

const monoHeadClass = "font-mono text-[11px] tracking-[0.08em] uppercase";

export function ExpenseDocumentsTableHeader() {
  const t = useTranslations("ExpenseDocuments.table.headers");

  return (
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        <TableHead className="sr-only">{t("expand")}</TableHead>
        <TableHead className={monoHeadClass}>{t("sender")}</TableHead>
        <TableHead className={monoHeadClass}>{t("document")}</TableHead>
        <TableHead className={cn(monoHeadClass, "border-l")}>
          {t("received")}
        </TableHead>
        <TableHead className={cn(monoHeadClass, "border-l")}>
          {t("pdfs")}
        </TableHead>
        <TableHead className={cn(monoHeadClass, "border-l text-right")}>
          {t("actions")}
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
