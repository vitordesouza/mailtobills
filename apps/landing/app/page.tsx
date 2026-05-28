import { Button } from "@mailtobills/ui/components/button";
import { FileArchive, FileText, Mail, PackageCheck } from "lucide-react";

const dashboardUrl =
  process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3000/signin";

const flowSteps = [
  {
    icon: Mail,
    title: "Forward PDFs",
    copy: "Send received supplier invoices, receipts, bills, or faturas from your trusted email.",
  },
  {
    icon: PackageCheck,
    title: "Collect by month",
    copy: "One accepted forwarded email becomes one document row with its PDF attachment set.",
  },
  {
    icon: FileArchive,
    title: "Export for accountant",
    copy: "Download a ZIP with the current primary PDFs and a CSV manifest of known metadata.",
  },
];

export default function Page() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <section className="relative min-h-[86svh] overflow-hidden border-b">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8fafc_0%,#eef6f2_48%,#fff7ed_100%)]" />
        <div className="relative mx-auto grid min-h-[86svh] max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="max-w-2xl space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-sm font-medium">
              <Mail className="size-4 text-emerald-700" />
              Forward expense PDFs
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl lg:text-6xl">
                MailToBills
              </h1>
              <p className="max-w-xl text-lg leading-8 text-muted-foreground">
                Collect received expense documents by month and export a clean
                package for your accountant.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href={dashboardUrl}>Open dashboard</a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#how-it-works">See the flow</a>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-lg border bg-background shadow-xl">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <div className="text-sm font-semibold">May 2026</div>
                  <div className="text-xs text-muted-foreground">
                    Collected Expense Documents
                  </div>
                </div>
                <div className="rounded-md bg-emerald-700 px-3 py-1 text-sm font-medium text-white">
                  Export ZIP
                </div>
              </div>
              <div className="divide-y">
                {[
                  ["supplier-receipt.pdf", "Receipts from travel", "2 PDFs"],
                  ["fatura-energia-maio.pdf", "Monthly utility email", "1 PDF"],
                  ["software-bill.pdf", "Subscription receipt", "3 PDFs"],
                ].map(([filename, subject, count]) => (
                  <div
                    key={filename}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-4"
                  >
                    <div className="flex size-10 items-center justify-center rounded-md bg-amber-100 text-amber-800">
                      <FileText className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {filename}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {subject}
                      </div>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                      {count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          {flowSteps.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="rounded-lg border p-5">
              <Icon className="mb-4 size-5 text-emerald-700" />
              <h2 className="text-base font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {copy}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
