import { CalendarX } from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { formatCollectionMonthLabel } from "@/lib/localized-format";
import { getMonthInfo } from "@/lib/months";
import { Button } from "@mailtobills/ui/components/button";
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@mailtobills/ui/components/empty-state";

export default async function CollectionMonthNotFound() {
  const currentMonth = getMonthInfo();
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("CollectionMonth.notFound"),
  ]);
  const currentMonthLabel = formatCollectionMonthLabel(
    currentMonth.start,
    locale,
  );

  return (
    <EmptyState>
      <EmptyStateIcon>
        <CalendarX />
      </EmptyStateIcon>
      <EmptyStateTitle>{t("title")}</EmptyStateTitle>
      <EmptyStateDescription>{t("description")}</EmptyStateDescription>
      <EmptyStateActions>
        <Button asChild typography="mono">
          <Link href={`/m/${currentMonth.value}`}>
            {t("openMonth", { month: currentMonthLabel })}
          </Link>
        </Button>
      </EmptyStateActions>
    </EmptyState>
  );
}
