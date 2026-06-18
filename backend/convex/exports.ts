import { getAuthUserId } from "@convex-dev/auth/server";
import { isCollectionMonth } from "@mailtobills/types";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { getEmailSender } from "./email";
import { buildAccountantExportEmail } from "./email/templates";
import { buildAccountantExportZip } from "./lib/accountantExport";

type AccountantExportCustomer = {
  name?: string;
  email?: string;
  isPro?: boolean;
  accountantEmail?: string;
  accountantName?: string;
};

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
