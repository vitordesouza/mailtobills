import { getTranslations } from "next-intl/server";

import { Button } from "@mailtobills/ui/components/button";

import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-16">
      <div className="max-w-md space-y-5 text-center">
        <p className="text-muted-foreground font-mono text-sm font-semibold">
          404
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
        <Button asChild>
          <Link href="/">{t("backHome")}</Link>
        </Button>
      </div>
    </main>
  );
}
