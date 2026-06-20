import { localeFormats, type Locale } from "@mailtobills/i18n";

export function getDateLocale(locale: Locale) {
  return localeFormats[locale].dateLocale;
}

export function formatCollectionMonthLabel(
  date: Date,
  locale: Locale,
  month: "short" | "long" = "long",
) {
  return new Intl.DateTimeFormat(getDateLocale(locale), {
    month,
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}

export function formatDocumentDate(timestamp: number | undefined, locale: Locale) {
  if (!timestamp) return null;

  return new Intl.DateTimeFormat(getDateLocale(locale), {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(timestamp));
}

export function formatFileSize(
  fileSize: number | undefined,
  locale: Locale,
  labels: { kb: (size: string) => string; mb: (size: string) => string },
) {
  if (!fileSize || fileSize <= 0) return null;

  if (fileSize < 1024 * 1024) {
    const size = new Intl.NumberFormat(getDateLocale(locale), {
      maximumFractionDigits: 0,
    }).format(Math.round(fileSize / 1024));
    return labels.kb(size);
  }

  const size = new Intl.NumberFormat(getDateLocale(locale), {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(fileSize / 1024 / 1024);
  return labels.mb(size);
}
