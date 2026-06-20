"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export function MonthPageTitle() {
  const pathname = usePathname();
  const t = useTranslations("Navigation");
  const title = pathname.includes("/reports")
    ? t("reports")
    : pathname.includes("/settings")
      ? t("settings")
      : t("dashboard");

  return <span className="text-sm font-medium">{title}</span>;
}
