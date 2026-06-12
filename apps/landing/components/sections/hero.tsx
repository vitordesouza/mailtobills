import { ArrowRight, Mail } from "lucide-react";

import { Button } from "@mailtobills/ui/components/button";

import { DashboardPreview } from "@/components/dashboard-preview";
import { signUpUrl } from "@/lib/links";

export function Hero() {
  return (
    <section className="bg-sidebar/60 relative overflow-hidden border-b">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_0%,oklch(0.94_0.04_160/0.55)_0%,transparent_70%),radial-gradient(40%_40%_at_15%_20%,oklch(0.96_0.03_95/0.6)_0%,transparent_70%)] dark:bg-[radial-gradient(60%_50%_at_70%_0%,oklch(0.4_0.07_160/0.25)_0%,transparent_70%)]"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 sm:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:py-24">
        <div className="animate-in fade-in slide-in-from-bottom-2 max-w-2xl space-y-7 duration-500">
          <div className="bg-background text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] font-medium tracking-[0.08em] uppercase shadow-xs">
            <Mail className="text-primary size-3.5" />
            Email-first expense collection
          </div>
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
            <Button asChild size="lg" typography="mono">
              <a href={signUpUrl}>
                Start collecting free
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" typography="mono">
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>
          <p className="text-muted-foreground font-mono text-[11px] font-medium tracking-[0.08em] uppercase">
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
