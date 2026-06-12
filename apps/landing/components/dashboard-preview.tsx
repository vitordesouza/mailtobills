import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Inbox,
  Paperclip,
} from "lucide-react";

import { Badge } from "@mailtobills/ui/components/badge";
import {
  StatLabel,
  StatTilePeriod,
} from "@mailtobills/ui/components/stat";
import { TrendChip } from "@mailtobills/ui/components/trend-chip";

const previewStats = [
  { icon: Inbox, label: "Collected", value: "12", delta: 20 },
  { icon: Paperclip, label: "Attachments", value: "17", delta: 13.3 },
  {
    icon: FileText,
    label: "Primary PDFs",
    value: "12",
    delta: 20,
    iconClassName: "text-amber-600 dark:text-amber-400",
  },
];

const previewRows = [
  {
    sender: "E",
    filename: "fatura-energia-maio.pdf",
    subject: "Fwd: A sua fatura de eletricidade",
    date: "May 3",
    count: 1,
  },
  {
    sender: "A",
    filename: "invoice-2026-0512.pdf",
    subject: "Fwd: Your receipt from Acme Hosting",
    date: "May 12",
    count: 2,
  },
  {
    sender: "B",
    filename: "hotel-receipt-lisboa.pdf",
    subject: "Fwd: Booking confirmation and receipt",
    date: "May 21",
    count: 3,
  },
];

/**
 * A static, hand-rolled rendition of the real dashboard: canvas chrome
 * around the floating white panel, built from the same ui primitives so
 * the preview never drifts from the product.
 */
export function DashboardPreview() {
  return (
    <div className="bg-sidebar rounded-2xl border p-2 shadow-2xl">
      <div className="bg-background overflow-hidden rounded-xl border shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
          <div className="bg-background flex items-center rounded-lg border shadow-xs">
            <span className="text-muted-foreground flex size-7 items-center justify-center border-r">
              <ChevronLeft className="size-3.5" />
            </span>
            <span className="px-2.5 font-mono text-[11px] font-medium tracking-[0.06em] uppercase">
              May 2026
            </span>
            <span className="text-muted-foreground flex size-7 items-center justify-center border-l">
              <ChevronRight className="size-3.5" />
            </span>
          </div>
          <span className="bg-primary text-primary-foreground inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-[11px] font-medium tracking-[0.08em] uppercase">
            <Download className="size-3.5" />
            Export month
          </span>
        </div>
        <div className="divide-border grid grid-cols-3 divide-x border-b">
          {previewStats.map(
            ({ icon: Icon, label, value, delta, iconClassName }) => (
              <div key={label} className="flex min-w-0 flex-col gap-2 p-3">
                <div className="text-muted-foreground flex items-center justify-between gap-2">
                  <StatLabel className="text-[10px]">{label}</StatLabel>
                  <Icon className={`size-3.5 shrink-0 ${iconClassName ?? ""}`} />
                </div>
                <div className="text-2xl leading-none font-semibold tracking-tight tabular-nums">
                  {value}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <TrendChip delta={delta} className="text-[10px]" />
                  <StatTilePeriod className="hidden lg:inline-flex">
                    VS APR
                  </StatTilePeriod>
                </div>
              </div>
            ),
          )}
        </div>
        <div className="divide-y">
          {previewRows.map(({ sender, filename, subject, date, count }) => (
            <div
              key={filename}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3"
            >
              <div className="bg-background flex size-8 items-center justify-center rounded-lg border text-xs font-semibold shadow-xs">
                {sender}
              </div>
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-xs font-medium">
                    {filename}
                  </span>
                  <Badge variant="warning" className="hidden sm:inline-flex">
                    Primary
                  </Badge>
                </div>
                <div className="text-muted-foreground truncate text-[11px]">
                  {subject}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground hidden font-mono text-[10px] uppercase tabular-nums sm:block">
                  {date}
                </span>
                <Badge variant="outline" className="min-w-6 justify-center">
                  {count}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
