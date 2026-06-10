import { FileArchive, FolderCheck, Mail } from "lucide-react";

const steps = [
  {
    icon: Mail,
    step: "01",
    title: "Forward the email",
    copy: "Send supplier invoices, receipts, bills, or faturas from your trusted email to your private collection address.",
  },
  {
    icon: FolderCheck,
    step: "02",
    title: "We file it by month",
    copy: "Each accepted email becomes one document row, with its PDF attachments stored in the right Collection Month.",
  },
  {
    icon: FileArchive,
    step: "03",
    title: "Export for your accountant",
    copy: "Download a ZIP with the primary PDFs and a CSV manifest — sender, subject, date, and filename for every document.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-14 border-b">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            How it works
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            From inbox chaos to a clean monthly package
          </h2>
          <p className="text-muted-foreground text-pretty">
            No apps to install, no receipts to scan, no folders to maintain.
            If you can forward an email, you are done.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map(({ icon: Icon, step, title, copy }) => (
            <div
              key={step}
              className="bg-card hover:border-ring/40 rounded-lg border p-6 shadow-xs transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="bg-muted/40 flex size-10 items-center justify-center rounded-lg border">
                  <Icon className="size-5" />
                </span>
                <span className="text-muted-foreground/60 text-sm font-semibold tabular-nums">
                  {step}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                {copy}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
