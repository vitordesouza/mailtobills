import { Button } from "@mailtobills/ui/components/button";
import { Logo } from "@mailtobills/ui/components/logo";

import { signInUrl, signUpUrl } from "@/lib/links";

const navLinks = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
        <a href="#" className="flex items-center gap-2">
          <Logo className="size-7" />
          <span className="text-sm font-semibold tracking-tight">
            MailToBills
          </span>
        </a>
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <a href={signInUrl}>Sign in</a>
          </Button>
          <Button asChild size="sm">
            <a href={signUpUrl}>Get started</a>
          </Button>
        </div>
      </div>
    </header>
  );
}
