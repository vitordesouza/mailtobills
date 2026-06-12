import { Check } from "lucide-react";

import { Badge } from "@mailtobills/ui/components/badge";
import { Button } from "@mailtobills/ui/components/button";
import { cn } from "@mailtobills/ui/lib/utils";

import { SectionEyebrow } from "@/components/section-eyebrow";
import { signUpUrl } from "@/lib/links";

const plans = [
  {
    name: "Starter",
    price: "€0",
    period: "forever",
    description: "Try the full forward-and-collect flow on real documents.",
    cta: "Start free",
    highlighted: false,
    features: [
      "Your private collection address",
      "Up to 10 documents per month",
      "Monthly dashboard with primary PDFs",
      "Manual ZIP + CSV export",
    ],
  },
  {
    name: "Pro",
    price: "€9",
    period: "per month",
    description: "For businesses that close every month with an accountant.",
    cta: "Get Pro",
    highlighted: true,
    features: [
      "Everything in Starter",
      "Unlimited documents and attachments",
      "Accountant export for every month",
      "Priority support",
      "Early access to new features",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-14 border-b">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <SectionEyebrow>Pricing</SectionEyebrow>
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            Cheaper than an hour of bookkeeping
          </h2>
          <p className="text-muted-foreground text-pretty">
            Start free. Upgrade when MailToBills is collecting more than it
            costs.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-3xl gap-4 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "bg-card relative flex flex-col rounded-xl border p-6 shadow-xs",
                plan.highlighted && "border-primary/40 shadow-md",
              )}
            >
              {plan.highlighted ? (
                <Badge className="absolute -top-2.5 right-6 rounded-full px-2.5 font-mono text-[10px] tracking-[0.08em] uppercase">
                  Early-bird price
                </Badge>
              ) : null}
              <h3 className="text-base font-semibold">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-4xl font-semibold tracking-tight tabular-nums">
                  {plan.price}
                </span>
                <span className="text-muted-foreground text-sm">
                  {plan.period}
                </span>
              </div>
              <p className="text-muted-foreground mt-2 text-sm">
                {plan.description}
              </p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="text-primary mt-0.5 size-4 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={plan.highlighted ? "default" : "outline"}
                typography="mono"
                className="mt-6 w-full"
              >
                <a href={signUpUrl}>{plan.cta}</a>
              </Button>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground mt-6 text-center text-sm">
          Prices in EUR, VAT excluded. Cancel anytime — your exports stay
          yours.
        </p>
      </div>
    </section>
  );
}
