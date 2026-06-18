import {
  buildAccountantExportEmail,
  buildEmptyMonthEmail,
  buildExportFailureEmail,
} from "../email/templates";

import type { Id } from "../_generated/dataModel";
import type { EmailSender } from "../email";

const MAX_SEND_ATTEMPTS = 3;

export type AccountantExportCustomer = {
  name?: string;
  email?: string;
  isPro?: boolean;
  accountantEmail?: string;
  accountantName?: string;
};

type ScheduledAccountantExportCustomer = AccountantExportCustomer & {
  _id: Id<"users">;
  exportScheduleLastSentMonth?: string;
};

type BuildAccountantExportZipResult = {
  filename: string;
  zipBytes: Uint8Array;
  documentCount: number;
};

type AccountantExportDeliveryDeps = {
  buildAccountantExportZip(params: {
    userId: Id<"users">;
    month: string;
  }): Promise<BuildAccountantExportZipResult>;
  emailSender: EmailSender;
  markExportScheduleSent?(params: {
    userId: Id<"users">;
    month: string;
  }): Promise<void>;
  siteUrl?: string;
  logError?(message: string, context: Record<string, unknown>): void;
};

function parseCollectionMonthParts(month: string) {
  const [yearText, monthText] = month.split("-");
  return { year: Number(yearText), month: Number(monthText) };
}

function dashboardMonthUrl(month: string, siteUrl: string | undefined) {
  const baseUrl = siteUrl ?? "https://app.mailtobills.com";
  return `${baseUrl.replace(/\/+$/, "")}/m/${month}`;
}

function customerName(customer: AccountantExportCustomer) {
  return customer.name ?? customer.email ?? "Customer";
}

async function sendAccountantExportEmail({
  deps,
  customer,
  exportZip,
  month,
}: {
  deps: Pick<AccountantExportDeliveryDeps, "emailSender">;
  customer: AccountantExportCustomer & { accountantEmail: string };
  exportZip: BuildAccountantExportZipResult;
  month: string;
}) {
  const { year, month: monthNumber } = parseCollectionMonthParts(month);
  const name = customerName(customer);
  const email = buildAccountantExportEmail({
    customerName: name,
    month: monthNumber,
    year,
    accountantName: customer.accountantName,
  });

  await deps.emailSender.send({
    to: customer.accountantEmail,
    cc: customer.email,
    fromName: name,
    subject: email.subject,
    bodyHtml: email.bodyHtml,
    attachment: {
      filename: exportZip.filename,
      content: exportZip.zipBytes,
      contentType: "application/zip",
    },
  });
}

export async function sendManualAccountantExport({
  deps,
  customer,
  userId,
  month,
}: {
  deps: AccountantExportDeliveryDeps;
  customer: AccountantExportCustomer | null;
  userId: Id<"users">;
  month: string;
}): Promise<{ sentTo: string }> {
  if (!customer?.isPro) {
    throw new Error("PRO_REQUIRED");
  }

  if (!customer.accountantEmail) {
    throw new Error("ACCOUNTANT_EMAIL_NOT_CONFIGURED");
  }

  const exportZip = await deps.buildAccountantExportZip({
    userId,
    month,
  });

  await sendAccountantExportEmail({
    deps,
    customer: {
      ...customer,
      accountantEmail: customer.accountantEmail,
    },
    exportZip,
    month,
  });

  return { sentTo: customer.accountantEmail };
}

export async function sendScheduledAccountantExport({
  deps,
  customer,
  month,
}: {
  deps: AccountantExportDeliveryDeps;
  customer: ScheduledAccountantExportCustomer;
  month: string;
}) {
  if (customer.exportScheduleLastSentMonth === month) {
    return { status: "already_sent" as const };
  }

  const exportZip = await deps.buildAccountantExportZip({
    userId: customer._id,
    month,
  });

  const { year, month: monthNumber } = parseCollectionMonthParts(month);
  const name = customerName(customer);

  if (exportZip.documentCount === 0) {
    if (customer.email) {
      const email = buildEmptyMonthEmail({
        customerName: name,
        month: monthNumber,
        year,
      });

      await deps.emailSender.send({
        to: customer.email,
        fromName: name,
        subject: email.subject,
        bodyHtml: email.bodyHtml,
      });
    }

    await deps.markExportScheduleSent?.({
      userId: customer._id,
      month,
    });

    return { status: "empty_month" as const };
  }

  if (!customer.accountantEmail) {
    return { status: "missing_accountant_address" as const };
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt++) {
    try {
      await sendAccountantExportEmail({
        deps,
        customer: {
          ...customer,
          accountantEmail: customer.accountantEmail,
        },
        exportZip,
        month,
      });

      await deps.markExportScheduleSent?.({
        userId: customer._id,
        month,
      });

      return { status: "sent" as const };
    } catch (error) {
      lastError = error;
    }
  }

  deps.logError?.("Scheduled export send failed after retries", {
    userId: customer._id,
    month,
    lastError,
  });

  if (customer.email) {
    const failure = buildExportFailureEmail({
      customerName: name,
      month: monthNumber,
      year,
      dashboardUrl: dashboardMonthUrl(month, deps.siteUrl),
    });

    await deps.emailSender.send({
      to: customer.email,
      fromName: name,
      subject: failure.subject,
      bodyHtml: failure.bodyHtml,
    });
  }

  return { status: "failed" as const };
}
