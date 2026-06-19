import { defaultLocale } from "@mailtobills/i18n"
import { getRequestConfig } from "next-intl/server"

export default getRequestConfig(async () => ({
  locale: defaultLocale,
  messages: {},
}))
