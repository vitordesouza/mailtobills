import { Logo } from "@mailtobills/ui/components/logo";
import { getTranslations } from "next-intl/server";

export async function SiteFooter() {
  const t = await getTranslations("Footer");

  return (
    <footer className="border-t">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm sm:flex-row">
        <div className="flex items-center gap-2.5">
          <Logo className="text-foreground size-6" />
          <span className="text-foreground font-medium">MailToBills</span>
          <span className="hidden font-mono text-[10px] font-medium tracking-[0.08em] uppercase sm:inline">
            {t("tagline")}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="#how-it-works"
            className="hover:text-foreground transition-colors"
          >
            {t("howItWorks")}
          </a>
          <a
            href="#pricing"
            className="hover:text-foreground transition-colors"
          >
            {t("pricing")}
          </a>
          <a href="#faq" className="hover:text-foreground transition-colors">
            {t("faq")}
          </a>
        </div>
        <div>{t("copyright", { year: new Date().getFullYear() })}</div>
      </div>
    </footer>
  );
}
