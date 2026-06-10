import { ArrowRight, Mail } from "lucide-react";

import { Badge } from "@mailtobills/ui/components/badge";
import { Button } from "@mailtobills/ui/components/button";

import { DashboardPreview } from "@/components/dashboard-preview";
import { signUpUrl } from "@/lib/links";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_0%,oklch(0.95_0.04_165/0.6)_0%,transparent_70%),radial-gradient(40%_40%_at_15%_20%,oklch(0.96_0.04_85/0.5)_0%,transparent_70%)] dark:bg-[radial-gradient(60%_50%_at_70%_0%,oklch(0.4_0.07_165/0.25)_0%,transparent_70%)]"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 sm:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:py-24">
        <div className="animate-in fade-in slide-in-from-bottom-2 max-w-2xl space-y-7 duration-500">
          <Badge
            variant="success"
            className="rounded-full px-3 py-1 text-xs shadow-xs"
          >
            <Mail className="size-3.5" />
            Email-first expense collection
          </Badge>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Stop chasing expense PDFs every month.
            </h1>
            <p className="text-muted-foreground max-w-xl text-lg leading-8 text-pretty">
              Forward any invoice, receipt, or fatura to your private
              MailToBills address. It is filed into the right month — and your
              accountant gets one clean ZIP with every PDF and a CSV manifest.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <a href={signUpUrl}>
                Start collecting free
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>
          <p className="text-muted-foreground text-sm">
            Free to start · No credit card · 2-minute setup
          </p>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 relative duration-700">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}
