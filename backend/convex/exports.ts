import { getAuthUserId } from "@convex-dev/auth/server";
import {
  isCollectionMonth,
  shiftCollectionMonth,
  toCollectionMonthValue,
} from "@mailtobills/domain";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";
import { getEmailSender } from "./email";
import {
  sendManualAccountantExport,
  sendScheduledAccountantExport,
} from "./lib/accountantExportDelivery";
import { buildAccountantExportZip } from "./lib/accountantExport";

import type { AccountantExportCustomer } from "./lib/accountantExportDelivery";

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
        await sendScheduledAccountantExport({
          deps: {
            buildAccountantExportZip: (params) =>
              buildAccountantExportZip(ctx, params),
            emailSender: getEmailSender(),
            markExportScheduleSent: async (params) => {
              await ctx.runMutation(internal.users.markExportScheduleSent, params);
            },
            siteUrl: process.env.SITE_URL,
            logError: (message, context) => console.error(message, context),
          },
          customer: user,
          month,
        });
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

    return await sendManualAccountantExport({
      deps: {
        buildAccountantExportZip: (params) =>
          buildAccountantExportZip(ctx, params),
        emailSender: getEmailSender(),
      },
      customer,
      userId,
      month: args.month,
    });
  },
});
