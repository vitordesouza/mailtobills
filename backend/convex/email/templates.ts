const PT_MONTH_NAMES = [
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
];

type EmailMonthParams = {
  customerName: string;
  month: number;
  year: number;
};

type AccountantExportEmailParams = EmailMonthParams & {
  accountantName?: string;
};

type ExportFailureEmailParams = EmailMonthParams & {
  dashboardUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getMonthName(month: number) {
  const monthName = PT_MONTH_NAMES[month - 1];

  if (!monthName) {
    throw new Error("INVALID_EMAIL_MONTH");
  }

  return monthName;
}

function periodLabel(month: number, year: number) {
  return `${getMonthName(month)} ${year}`;
}

export function buildAccountantExportEmail(
  params: AccountantExportEmailParams,
) {
  const period = periodLabel(params.month, params.year);
  const accountantName = params.accountantName?.trim() || "contabilista";
  const escapedAccountantName = escapeHtml(accountantName);
  const escapedCustomerName = escapeHtml(params.customerName);

  return {
    subject: `MailToBills - Documentos de ${period}`,
    bodyHtml: [
      `<p>Olá ${escapedAccountantName},</p>`,
      `<p>Em anexo encontra os documentos de despesa recolhidos em ${escapeHtml(
        period,
      )} por ${escapedCustomerName} via MailToBills.</p>`,
      `<p>${escapedCustomerName}</p>`,
    ].join(""),
  };
}

export function buildEmptyMonthEmail(params: EmailMonthParams) {
  const period = periodLabel(params.month, params.year);
  const escapedCustomerName = escapeHtml(params.customerName);

  return {
    subject: `MailToBills - Sem documentos em ${period}`,
    bodyHtml: [
      `<p>Olá ${escapedCustomerName},</p>`,
      `<p>Não encontrámos documentos de despesa para enviar em ${escapeHtml(
        period,
      )}.</p>`,
      "<p>MailToBills</p>",
    ].join(""),
  };
}

export function buildExportFailureEmail(params: ExportFailureEmailParams) {
  const period = periodLabel(params.month, params.year);
  const escapedCustomerName = escapeHtml(params.customerName);
  const escapedDashboardUrl = escapeHtml(params.dashboardUrl);

  return {
    subject: `MailToBills - Falha no envio de ${period}`,
    bodyHtml: [
      `<p>Olá ${escapedCustomerName},</p>`,
      `<p>Não foi possível enviar automaticamente os documentos de despesa de ${escapeHtml(
        period,
      )}.</p>`,
      `<p>Pode rever e exportar os documentos no dashboard: <a href="${escapedDashboardUrl}">${escapedDashboardUrl}</a></p>`,
      "<p>MailToBills</p>",
    ].join(""),
  };
}
