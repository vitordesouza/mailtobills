import { getAuthUserId } from "@convex-dev/auth/server";
import {
  isCollectionMonth,
  shiftCollectionMonth,
  toCollectionMonthValue,
} from "@mailtobills/types";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";
import { getEmailSender } from "./email";
import {
  buildAccountantExportEmail,
  buildEmptyMonthEmail,
  buildExportFailureEmail,
} from "./email/templates";
import { buildAccountantExportZip } from "./lib/accountantExport";

import type { ActionCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

const MAX_SEND_ATTEMPTS = 3;

type AccountantExportCustomer = {
  name?: string;
  email?: string;
  isPro?: boolean;
  accountantEmail?: string;
  accountantName?: string;
};

function parseCollectionMonthParts(month: string) {
  const [yearText, monthText] = month.split("-");
  return { year: Number(yearText), month: Number(monthText) };
}

function dashboardMonthUrl(month: string) {
  const siteUrl = process.env.SITE_URL ?? "https://app.mailtobills.com";
  return `${siteUrl.replace(/\/+$/, "")}/m/${month}`;
}

async function sendScheduledExportForUser(
  ctx: ActionCtx,
  user: Doc<"users">,
  month: string
) {
  // Idempotency: the cron only fires on the scheduled day, but guard against
  // a double-fire on the same day re-sending the same Collection Month.
  if (user.exportScheduleLastSentMonth === month) {
    return;
  }

  const { year, month: monthNumber } = parseCollectionMonthParts(month);
  const customerName = user.name ?? user.email ?? "Customer";
  const emailSender = getEmailSender();

  const exportZip = await buildAccountantExportZip(ctx, {
    userId: user._id,
    month,
  });

  // Empty Collection Month: notify the Customer only, never the accountant.
  if (exportZip.documentCount === 0) {
    if (user.email) {
      const email = buildEmptyMonthEmail({ customerName, month: monthNumber, year });
      await emailSender.send({
        to: user.email,
        fromName: customerName,
        subject: email.subject,
        bodyHtml: email.bodyHtml,
      });
    }
    await ctx.runMutation(internal.users.markExportScheduleSent, {
      userId: user._id,
      month,
    });
    return;
  }

  if (!user.accountantEmail) {
    return;
  }

  const email = buildAccountantExportEmail({
    customerName,
    month: monthNumber,
    year,
    accountantName: user.accountantName,
  });

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt++) {
    try {
      await emailSender.send({
        to: user.accountantEmail,
        cc: user.email,
        fromName: customerName,
        subject: email.subject,
        bodyHtml: email.bodyHtml,
        attachment: {
          filename: exportZip.filename,
          content: exportZip.zipBytes,
          contentType: "application/zip",
        },
      });

      await ctx.runMutation(internal.users.markExportScheduleSent, {
        userId: user._id,
        month,
      });
      return;
    } catch (error) {
      lastError = error;
    }
  }

  console.error("Scheduled export send failed after retries", {
    userId: user._id,
    month,
    lastError,
  });

  // Final failure: notify the Customer with a manual export link. We do not
  // mark the month sent, so the failure remains visible.
  if (user.email) {
    const failure = buildExportFailureEmail({
      customerName,
      month: monthNumber,
      year,
      dashboardUrl: dashboardMonthUrl(month),
    });
    await emailSender.send({
      to: user.email,
      fromName: customerName,
      subject: failure.subject,
      bodyHtml: failure.bodyHtml,
    });
  }
}

export const sendScheduledExports = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const day = now.getUTCDate();
    const month = shiftCollectionMonth(toCollectionMonthValue(now), -1);

    const users = await ctx.runQuery(internal.users.getUsersDueForExport, {
      day,
    });

    for (const user of users) {
      try {
        await sendScheduledExportForUser(ctx, user, month);
      } catch (error) {
        // One Customer's failure must not block the rest of the run.
        console.error("Scheduled export errored", {
          userId: user._id,
          error,
        });
      }
    }
  },
});

export const sendManualExportToAccountant = action({
  args: {
    month: v.string(),
  },
  handler: async (ctx, args): Promise<{ sentTo: string }> => {
    if (!isCollectionMonth(args.month)) {
      throw new Error("INVALID_COLLECTION_MONTH");
    }

    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("UNAUTHENTICATED");
    }

    const customer: AccountantExportCustomer | null = await ctx.runQuery(
      internal.users.getAccountantExportCustomer,
      { userId },
    );

    if (!customer?.isPro) {
      throw new Error("PRO_REQUIRED");
    }

    if (!customer?.accountantEmail) {
      throw new Error("ACCOUNTANT_EMAIL_NOT_CONFIGURED");
    }

    const [yearText, monthText] = args.month.split("-");
    const year = Number(yearText);
    const month = Number(monthText);
    const customerName = customer.name ?? customer.email ?? "Customer";
    const exportZip = await buildAccountantExportZip(ctx, {
      userId,
      month: args.month,
    });
    const email = buildAccountantExportEmail({
      customerName,
      month,
      year,
      accountantName: customer.accountantName,
    });

    await getEmailSender().send({
      to: customer.accountantEmail,
      cc: customer.email,
      fromName: customerName,
      subject: email.subject,
      bodyHtml: email.bodyHtml,
      attachment: {
        filename: exportZip.filename,
        content: exportZip.zipBytes,
        contentType: "application/zip",
      },
    });

    return { sentTo: customer.accountantEmail };
  },
});
