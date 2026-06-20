import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { isLocale } from "@mailtobills/i18n";

type CatchAllLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>;

export async function generateMetadata({
  params,
}: CatchAllLayoutProps): Promise<Metadata> {
  const { locale: requestedLocale } = await params;

  if (!isLocale(requestedLocale)) {
    notFound();
  }

  const t = await getTranslations({
    locale: requestedLocale,
    namespace: "NotFound",
  });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: null,
      languages: {},
    },
    openGraph: null,
    twitter: null,
  };
}

export default function CatchAllLayout({ children }: CatchAllLayoutProps) {
  return children;
}
