import { defaultLocale, isLocale } from "@mailtobills/i18n";
import { getRequestConfig } from "next-intl/server";

const messageLoaders = {
  en: () => import("../messages/en/common.json"),
  "pt-PT": () => import("../messages/pt-PT/common.json"),
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale =
    requestedLocale && isLocale(requestedLocale)
      ? requestedLocale
      : defaultLocale;
  const messages = (await messageLoaders[locale]()).default;

  return { locale, messages };
});
