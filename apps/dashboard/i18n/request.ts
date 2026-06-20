import { getRequestConfig } from "next-intl/server";

import { resolveDashboardLocale } from "./locale";

const messageLoaders = {
  en: () => import("../messages/en/common.json"),
  "pt-PT": () => import("../messages/pt-PT/common.json"),
} as const;

export default getRequestConfig(async () => {
  const locale = await resolveDashboardLocale();
  const messages = (await messageLoaders[locale]()).default;

  return { locale, messages };
});
