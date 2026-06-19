export const supportedLocales = ["en", "pt-PT"] as const

export type Locale = (typeof supportedLocales)[number]

export const defaultLocale: Locale = "en"

export const localeLabels: Record<Locale, string> = {
  en: "English",
  "pt-PT": "Português (Portugal)",
}

export const localeFormats: Record<
  Locale,
  { currency: "EUR"; dateLocale: string }
> = {
  en: { currency: "EUR", dateLocale: "en-GB" },
  "pt-PT": { currency: "EUR", dateLocale: "pt-PT" },
}

export function isLocale(value: string): value is Locale {
  return supportedLocales.some((locale) => locale === value)
}
