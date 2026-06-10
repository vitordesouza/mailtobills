import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Inbox,
  Paperclip,
} from "lucide-react";

import { Badge } from "@mailtobills/ui/components/badge";

const previewRows = [
  {
    sender: "Energia",
    filename: "fatura-energia-maio.pdf",
    subject: "Fwd: A sua fatura de eletricidade",
    date: "May 3",
    count: 1,
  },
  {
    sender: "Hosting",
    filename: "invoice-2026-0512.pdf",
    subject: "Fwd: Your receipt from Acme Hosting",
    date: "May 12",
    count: 2,
  },
  {
    sender: "Travel",
    filename: "hotel-receipt-lisboa.pdf",
    subject: "Fwd: Booking confirmation and receipt",
    date: "May 21",
    count: 3,
  },
];

const previewStats = [
  { icon: Inbox, label: "Collected", value: "12", tone: "" },
  {
    icon: Paperclip,
    label: "PDF attachments",
    value: "17",
    tone: "border-emerald-400/15 bg-emerald-500/10 text-emerald-400",
  },
  {
    icon: FileText,
    label: "Primary PDFs",
    value: "12",
    tone: "border-amber-400/15 bg-amber-500/10 text-amber-400",
  },
];

/**
 * A static, hand-rolled rendition of the real dashboard. Wrapped in `.dark`
 * so it always uses the app's dark theme tokens, whatever the page theme.
 */
export function DashboardPreview() {
  return (
    <div className="dark bg-background text-foreground overflow-hidden rounded-xl border shadow-2xl">
      <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
        <div className="bg-background flex items-center rounded-lg border shadow-xs">
          <span className="text-muted-foreground flex size-7 items-center justify-center">
            <ChevronLeft className="size-3.5" />
          </span>
          <span className="border-x px-2.5 text-xs font-medium">May 2026</span>
          <span className="text-muted-foreground flex size-7 items-center justify-center">
            <ChevronRight className="size-3.5" />
          </span>
        </div>
        <span className="bg-primary text-primary-foreground inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium">
          <Download className="size-3.5" />
          Export month
        </span>
      </div>
      <div className="bg-muted/30 grid grid-cols-3 gap-3 border-b px-4 py-3">
        {previewStats.map(({ icon: Icon, label, value, tone }) => (
          <div key={label} className="flex min-w-0 items-center gap-2.5">
            <span
              className={`bg-background flex size-8 shrink-0 items-center justify-center rounded-lg border ${tone}`}
            >
              <Icon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="text-muted-foreground block truncate text-[10px] font-medium tracking-wide uppercase">
                {label}
              </span>
              <span className="block text-lg leading-none font-semibold tabular-nums">
                {value}
              </span>
            </span>
          </div>
        ))}
      </div>
      <div className="divide-y">
        {previewRows.map(({ sender, filename, subject, date, count }) => (
          <div
            key={filename}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3"
          >
            <div className="bg-background flex size-8 items-center justify-center rounded-lg border text-xs font-semibold shadow-xs">
              {sender.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-xs font-medium">{filename}</span>
                <Badge variant="warning" className="hidden sm:inline-flex">
                  Primary
                </Badge>
              </div>
              <div className="text-muted-foreground truncate text-[11px]">
                {subject}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground hidden text-[11px] tabular-nums sm:block">
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
  );
}
