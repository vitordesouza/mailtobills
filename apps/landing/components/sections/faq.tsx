import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What happens when I forward an email?",
    answer:
      "MailToBills checks that it comes from your trusted email address, stores the PDF attachments, and files everything into the Collection Month it arrives in. One forwarded email becomes one document row on your dashboard.",
  },
  {
    question: "What does my accountant actually receive?",
    answer:
      "A single ZIP per month containing the primary PDF of every collected document, plus a CSV manifest listing sender, subject, received date, and filename. No logins, no new tools on their side.",
  },
  {
    question: "Which file types are supported?",
    answer:
      "PDF attachments. That covers the overwhelming majority of invoices, receipts, bills, and faturas sent by suppliers today.",
  },
  {
    question: "Who can send documents to my collection address?",
    answer:
      "Only you. Forwards are accepted exclusively from the trusted email addresses on your account, so spam and strangers never reach your collection.",
  },
  {
    question: "Can I try it without forwarding real documents?",
    answer:
      "Yes — the dashboard includes a one-click demo document, so you can see the full collect-and-export flow before sending anything real.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-14 border-b">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <div className="space-y-3 text-center">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            FAQ
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            Questions, answered
          </h2>
        </div>
        <div className="mt-10 space-y-3">
          {faqs.map(({ question, answer }) => (
            <details
              key={question}
              className="bg-card group rounded-lg border px-5 shadow-xs"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
                {question}
                <ChevronDown className="text-muted-foreground size-4 shrink-0 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="text-muted-foreground animate-in fade-in slide-in-from-top-1 pb-4 text-sm leading-6 duration-200">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
