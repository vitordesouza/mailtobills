import { defineRouting } from "next-intl/routing";

import { defaultLocale, supportedLocales } from "@mailtobills/i18n";

export const routing = defineRouting({
  locales: supportedLocales,
  defaultLocale,
  localePrefix: "as-needed",
  localeDetection: false,
});
