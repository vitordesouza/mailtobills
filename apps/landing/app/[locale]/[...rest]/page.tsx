import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { isLocale } from "@mailtobills/i18n";

type CatchAllPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export async function generateMetadata({
  params,
}: CatchAllPageProps): Promise<Metadata> {
  const { locale: requestedLocale } = await params;

  if (!isLocale(requestedLocale)) {
    notFound();
  }

  const locale = requestedLocale;
  const t = await getTranslations({ locale, namespace: "NotFound" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: null,
      languages: {},
    },
  };
}

export default function CatchAllPage() {
  notFound();
}
