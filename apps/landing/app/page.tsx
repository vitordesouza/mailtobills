import { Button } from "@mailtobills/ui/components/button";
import { Logo } from "@mailtobills/ui/components/logo";
import {
  ArrowRight,
  Check,
  Download,
  FileArchive,
  FileText,
  Inbox,
  Mail,
  PackageCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const dashboardUrl =
  process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3000/signin";

const flowSteps = [
  {
    icon: Mail,
    title: "Forward the email",
    copy: "Suppliers, receipts, SaaS bills, faturas — send the original email to one collection address.",
  },
  {
    icon: PackageCheck,
    title: "PDFs land in order",
    copy: "MailToBills keeps the attachment, subject, sender, month and primary PDF decision together.",
  },
  {
    icon: FileArchive,
    title: "Export the month",
    copy: "Download a ZIP of primary PDFs plus a CSV manifest your accountant can actually use.",
  },
];

const documents = [
  ["Stripe", "invoice-2026-05.pdf", "May 04", "Primary"],
  ["Contoso Energy", "fatura-energia-maio.pdf", "May 12", "Primary"],
  ["Figma", "receipt-team-plan.pdf", "May 18", "Primary"],
  ["Rail Europe", "travel-recibo.pdf", "May 21", "Primary"],
];

const checklist = [
  "No OCR complexity in the MVP",
  "Multiple attachments handled without vendor hacks",
  "Month-based dashboard and accountant export",
];

const previewNavItems: { icon: LucideIcon; label: string; active: boolean }[] =
  [
    { icon: Inbox, label: "Inbox", active: true },
    { icon: Download, label: "Exports", active: false },
    { icon: Sparkles, label: "Setup", active: false },
  ];

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-4xl">
      <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-[radial-gradient(circle_at_20%_20%,oklch(0.86_0.08_190/70%),transparent_35%),radial-gradient(circle_at_80%_15%,oklch(0.9_0.1_75/65%),transparent_35%)] blur-2xl" />
      <div className="overflow-hidden rounded-[2rem] border bg-card/88 shadow-[0_1px_0_oklch(1_0_0/80%)_inset,0_28px_90px_oklch(0.18_0.012_258/14%)] backdrop-blur">
        <div className="grid grid-cols-[13rem_1fr]">
          <aside className="hidden border-r bg-muted/40 p-4 md:block">
            <div className="mb-8 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Logo className="size-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[-0.02em]">
                  MailToBills
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Inbox to export
                </p>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              {previewNavItems.map(({ icon: Icon, label, active }) => (
                <div
                  key={label}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
                    active
                      ? "bg-card font-semibold shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  {label}
                </div>
              ))}
            </div>
          </aside>
          <div className="min-w-0 p-4 sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Collection month
                </p>
                <h3 className="text-xl font-semibold tracking-[-0.035em]">
                  May 2026 expense inbox
                </h3>
              </div>
              <Button size="sm" className="rounded-xl">
                <Download className="size-4" />
                Export
              </Button>
            </div>
            <div className="mb-4 grid gap-2 sm:grid-cols-3">
              {[
                ["Docs", "24"],
                ["PDFs", "31"],
                ["Ready", "24"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border bg-background/65 p-3"
                >
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <div className="overflow-hidden rounded-2xl border bg-background/70">
              {documents.map(([sender, filename, date, status]) => (
                <div
                  key={filename}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b px-3 py-3 last:border-b-0"
                >
                  <div className="flex size-9 items-center justify-center rounded-xl bg-[oklch(0.94_0.08_78)] text-[oklch(0.42_0.1_70)]">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{sender}</p>
                      <span className="rounded-full bg-[oklch(0.92_0.06_175)] px-2 py-0.5 text-[10px] font-semibold text-[oklch(0.35_0.1_190)]">
                        {status}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {filename}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">{date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <main className="min-h-svh overflow-hidden bg-background text-foreground dark:bg-background dark:text-foreground">
      <section className="relative px-4 py-5 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_0%,oklch(0.9_0.08_190/55%),transparent_30%),radial-gradient(circle_at_85%_8%,oklch(0.92_0.1_75/58%),transparent_32%),linear-gradient(180deg,oklch(0.982_0.008_84),oklch(0.955_0.012_80))]" />
        <header className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border bg-card/68 px-3 py-3 shadow-[0_1px_0_oklch(1_0_0/75%)_inset] backdrop-blur">
          <a href="#top" className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Logo className="size-5 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-[-0.03em]">
              MailToBills
            </span>
          </a>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a
              href="#how-it-works"
              className="transition hover:text-foreground"
            >
              Flow
            </a>
            <a href="#why" className="transition hover:text-foreground">
              Why it wins
            </a>
            <a href="#pricing" className="transition hover:text-foreground">
              Pricing
            </a>
          </nav>
          <Button asChild size="sm" variant="outline" className="rounded-xl">
            <a href={dashboardUrl}>Sign in</a>
          </Button>
        </header>

        <div
          id="top"
          className="mx-auto grid max-w-6xl items-center gap-12 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:py-24"
        >
          <div className="max-w-2xl space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card/75 px-3 py-1 text-sm font-semibold text-muted-foreground shadow-[0_1px_0_oklch(1_0_0/75%)_inset] backdrop-blur">
              <span className="size-1.5 rounded-full bg-[oklch(0.68_0.14_180)]" />
              Built for freelancers who hate invoice admin
            </div>
            <div className="space-y-5">
              <h1 className="text-balance text-5xl font-semibold leading-[0.95] tracking-[-0.07em] text-foreground sm:text-6xl lg:text-7xl">
                Turn forwarded bills into an accountant-ready month.
              </h1>
              <p className="max-w-xl text-pretty text-lg leading-8 text-muted-foreground">
                MailToBills is the calm little inbox between your chaotic email
                and your accountant: collect PDFs, review the primary file,
                export a clean package.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg">
                <a href={`${dashboardUrl}?mode=signup`}>
                  Start collecting PDFs
                  <ArrowRight className="size-4" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#how-it-works">See the flow</a>
              </Button>
            </div>
            <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
              {checklist.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-[oklch(0.45_0.12_185)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section
        id="how-it-works"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              How it works
            </p>
            <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              The product stays simple because your workflow should be simple.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            No heavyweight parsing promise. No complicated states. Just a clean
            operational layer for receiving and exporting expense PDFs.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {flowSteps.map(({ icon: Icon, title, copy }, index) => (
            <div
              key={title}
              className="rounded-[1.5rem] border bg-card/78 p-5 shadow-[0_1px_0_oklch(1_0_0/70%)_inset]"
            >
              <div className="mb-8 flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  0{index + 1}
                </span>
              </div>
              <h3 className="font-semibold tracking-[-0.02em]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {copy}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="why"
        className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8"
      >
        <div className="grid gap-4 rounded-[2rem] border bg-foreground p-5 text-background shadow-[0_24px_80px_oklch(0.18_0.012_258/16%)] md:grid-cols-[1fr_0.85fr] md:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-background/55">
              Why customers pay
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
              It saves the end-of-month hunt through inboxes, downloads and
              duplicate PDFs.
            </h2>
          </div>
          <div className="grid gap-3 text-sm text-background/72">
            {[
              "A single place for received invoice PDFs.",
              "A monthly export that matches how accountants ask for documents.",
              "Enough structure to be useful, not enough complexity to become work.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-background/12 bg-background/6 p-4"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8"
      >
        <div className="rounded-[2rem] border bg-card/80 p-5 shadow-[0_1px_0_oklch(1_0_0/75%)_inset] md:p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                First paying customers
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">
                Simple early access.
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Start with the dashboard, collection address and monthly
                exports. Pay when it becomes part of your accounting rhythm.
              </p>
            </div>
            <Button asChild size="lg">
              <a href={`${dashboardUrl}?mode=signup`}>
                Get early access
                <ArrowRight className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
