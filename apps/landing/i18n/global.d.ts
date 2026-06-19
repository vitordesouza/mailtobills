import type { Locale } from "@mailtobills/i18n";
import messages from "../messages/en/common.json";

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}
