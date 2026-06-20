type EmailLocale = "en" | "pt-PT";

const MONTH_NAMES: Record<EmailLocale, string[]> = {
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  "pt-PT": [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ],
};

type EmailMonthParams = {
  customerName: string;
  month: number;
  year: number;
  locale?: EmailLocale;
};

type AccountantExportEmailParams = EmailMonthParams & {
  accountantName?: string;
};

type ExportFailureEmailParams = EmailMonthParams & {
  dashboardUrl: string;
};

type LapseNotificationEmailParams = {
  customerName: string;
  settingsUrl: string;
  locale?: EmailLocale;
};

type EmailCopy = {
  accountantFallback: string;
  accountantSubject(period: string): string;
  accountantGreeting(name: string): string;
  accountantBody(period: string, customerName: string): string;
  emptySubject(period: string): string;
  emptyBody(period: string): string;
  failureSubject(period: string): string;
  failureBody(period: string, dashboardUrl: string): string;
  lapseSubject: string;
  lapseEnded: string;
  lapsePreserved: string;
  lapseReactivate(settingsUrl: string): string;
};

const COPY: Record<EmailLocale, EmailCopy> = {
  en: {
    accountantFallback: "accountant",
    accountantSubject: (period) => `MailToBills - Documents for ${period}`,
    accountantGreeting: (name) => `Hi ${name},`,
    accountantBody: (period, customerName) =>
      `Attached are the expense documents collected in ${period} by ${customerName} via MailToBills.`,
    emptySubject: (period) => `MailToBills - No documents in ${period}`,
    emptyBody: (period) =>
      `We did not find expense documents to send for ${period}.`,
    failureSubject: (period) => `MailToBills - Failed to send ${period}`,
    failureBody: (period, dashboardUrl) =>
      `We could not send the expense documents for ${period} automatically. You can review and export them in the dashboard: <a href="${dashboardUrl}">${dashboardUrl}</a>`,
    lapseSubject: "MailToBills - Your Pro plan ended",
    lapseEnded:
      "Your Pro plan ended. Automatic accountant delivery (Export Schedule) and additional forwarding addresses are paused.",
    lapsePreserved:
      "Your documents and settings were preserved. You can continue exporting manually and reactivate Pro at any time.",
    lapseReactivate: (settingsUrl) =>
      `Reactivate Pro: <a href="${settingsUrl}">${settingsUrl}</a>`,
  },
  "pt-PT": {
    accountantFallback: "contabilista",
    accountantSubject: (period) => `MailToBills - Documentos de ${period}`,
    accountantGreeting: (name) => `Olá ${name},`,
    accountantBody: (period, customerName) =>
      `Em anexo encontra os documentos de despesa recolhidos em ${period} por ${customerName} via MailToBills.`,
    emptySubject: (period) => `MailToBills - Sem documentos em ${period}`,
    emptyBody: (period) =>
      `Não encontrámos documentos de despesa para enviar em ${period}.`,
    failureSubject: (period) => `MailToBills - Falha no envio de ${period}`,
    failureBody: (period, dashboardUrl) =>
      `Não foi possível enviar automaticamente os documentos de despesa de ${period}. Pode rever e exportar os documentos no dashboard: <a href="${dashboardUrl}">${dashboardUrl}</a>`,
    lapseSubject: "MailToBills - O seu plano Pro terminou",
    lapseEnded:
      "O seu plano Pro terminou. O envio automático para o seu contabilista (Export Schedule) e os endereços de reencaminhamento adicionais foram pausados.",
    lapsePreserved:
      "Os seus documentos e definições foram preservados. Pode continuar a exportar manualmente e reativar o plano Pro a qualquer momento.",
    lapseReactivate: (settingsUrl) =>
      `Reativar o plano Pro: <a href="${settingsUrl}">${settingsUrl}</a>`,
  },
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeLocale(locale: EmailLocale | undefined): EmailLocale {
  return locale === "pt-PT" ? "pt-PT" : "en";
}

function getMonthName(month: number, locale: EmailLocale) {
  const monthName = MONTH_NAMES[locale][month - 1];

  if (!monthName) {
    throw new Error("INVALID_EMAIL_MONTH");
  }

  return monthName;
}

function periodLabel(month: number, year: number, locale: EmailLocale) {
  return `${getMonthName(month, locale)} ${year}`;
}

export function buildAccountantExportEmail(
  params: AccountantExportEmailParams,
) {
  const locale = normalizeLocale(params.locale);
  const copy = COPY[locale];
  const period = periodLabel(params.month, params.year, locale);
  const accountantName =
    params.accountantName?.trim() || copy.accountantFallback;
  const escapedAccountantName = escapeHtml(accountantName);
  const escapedCustomerName = escapeHtml(params.customerName);
  const escapedPeriod = escapeHtml(period);

  return {
    subject: copy.accountantSubject(period),
    bodyHtml: [
      `<p>${copy.accountantGreeting(escapedAccountantName)}</p>`,
      `<p>${copy.accountantBody(escapedPeriod, escapedCustomerName)}</p>`,
      `<p>${escapedCustomerName}</p>`,
    ].join(""),
  };
}

export function buildEmptyMonthEmail(params: EmailMonthParams) {
  const locale = normalizeLocale(params.locale);
  const copy = COPY[locale];
  const period = periodLabel(params.month, params.year, locale);
  const escapedCustomerName = escapeHtml(params.customerName);
  const escapedPeriod = escapeHtml(period);

  return {
    subject: copy.emptySubject(period),
    bodyHtml: [
      `<p>${copy.accountantGreeting(escapedCustomerName)}</p>`,
      `<p>${copy.emptyBody(escapedPeriod)}</p>`,
      "<p>MailToBills</p>",
    ].join(""),
  };
}

export function buildExportFailureEmail(params: ExportFailureEmailParams) {
  const locale = normalizeLocale(params.locale);
  const copy = COPY[locale];
  const period = periodLabel(params.month, params.year, locale);
  const escapedCustomerName = escapeHtml(params.customerName);
  const escapedDashboardUrl = escapeHtml(params.dashboardUrl);
  const escapedPeriod = escapeHtml(period);

  return {
    subject: copy.failureSubject(period),
    bodyHtml: [
      `<p>${copy.accountantGreeting(escapedCustomerName)}</p>`,
      `<p>${copy.failureBody(escapedPeriod, escapedDashboardUrl)}</p>`,
      "<p>MailToBills</p>",
    ].join(""),
  };
}

export function buildLapseNotificationEmail(
  params: LapseNotificationEmailParams,
) {
  const locale = normalizeLocale(params.locale);
  const copy = COPY[locale];
  const escapedCustomerName = escapeHtml(params.customerName);
  const escapedSettingsUrl = escapeHtml(params.settingsUrl);

  return {
    subject: copy.lapseSubject,
    bodyHtml: [
      `<p>${copy.accountantGreeting(escapedCustomerName)}</p>`,
      `<p>${copy.lapseEnded}</p>`,
      `<p>${copy.lapsePreserved}</p>`,
      `<p>${copy.lapseReactivate(escapedSettingsUrl)}</p>`,
      "<p>MailToBills</p>",
    ].join(""),
  };
}
