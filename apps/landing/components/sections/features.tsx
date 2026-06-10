import {
  CalendarDays,
  FileArchive,
  Inbox,
  ShieldCheck,
  Star,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: CalendarDays,
    title: "Monthly collections",
    copy: "Every accepted email is filed into the month it arrives. Browse months like a ledger, not a folder tree.",
  },
  {
    icon: Star,
    title: "Primary PDF detection",
    copy: "Emails with several attachments? Mark the one that counts so exports only contain the real document.",
  },
  {
    icon: FileArchive,
    title: "Accountant-ready export",
    copy: "One ZIP per month: the primary PDFs plus a CSV manifest your accountant can open anywhere.",
  },
  {
    icon: ShieldCheck,
    title: "Trusted senders only",
    copy: "Only forwards from your registered email address are accepted. Nobody can stuff your collection.",
  },
  {
    icon: Inbox,
    title: "Works with any inbox",
    copy: "Gmail, Outlook, iCloud, your company mail — if it can forward an email, it works with MailToBills.",
  },
  {
    icon: Zap,
    title: "Nothing to install",
    copy: "No browser extensions, no mobile apps, no scanner hardware. Your email client is the integration.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-muted/30 scroll-mt-14 border-b">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Features
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            Built for people who&apos;d rather not do bookkeeping
          </h2>
          <p className="text-muted-foreground text-pretty">
            MailToBills does one job extremely well: collecting expense
            documents and handing them over in order.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, copy }) => (
            <div
              key={title}
              className="bg-card hover:border-ring/40 rounded-lg border p-6 shadow-xs transition-colors"
            >
              <span className="bg-muted/40 flex size-10 items-center justify-center rounded-lg border">
                <Icon className="size-5" />
              </span>
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
