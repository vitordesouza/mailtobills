import { Logo } from "@mailtobills/ui/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm sm:flex-row">
        <div className="flex items-center gap-2">
          <Logo className="size-6" />
          <span className="text-foreground font-medium">MailToBills</span>
          <span>· Expense documents. Organized.</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#how-it-works" className="hover:text-foreground transition-colors">
            How it works
          </a>
          <a href="#pricing" className="hover:text-foreground transition-colors">
            Pricing
          </a>
          <a href="#faq" className="hover:text-foreground transition-colors">
            FAQ
          </a>
        </div>
        <div>© {new Date().getFullYear()} MailToBills</div>
      </div>
    </footer>
  );
}
