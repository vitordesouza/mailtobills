import { getAuthUserId } from "@convex-dev/auth/server";
import {
  choosePrimaryAttachment,
  getAcceptedPdfAttachments,
} from "@mailtobills/types";
import { v } from "convex/values";

import { internalMutation, mutation, query } from "./_generated/server";

import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const attachmentArgs = v.object({
  originalFilename: v.string(),
  mimeType: v.optional(v.string()),
  fileSize: v.optional(v.number()),
  fileUrl: v.optional(v.string()),
  fileStorageId: v.optional(v.id("_storage")),
  attachmentId: v.optional(v.string()),
  originalOrder: v.number(),
});

async function requireSignedInUserId(ctx: Pick<QueryCtx | MutationCtx, "auth">) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("UNAUTHENTICATED");
  }

  return userId;
}

async function getOwnedExpenseDocument(
  ctx: Pick<QueryCtx | MutationCtx, "auth" | "db">,
  expenseDocumentId: Id<"expenseDocuments">
) {
  const userId = await requireSignedInUserId(ctx);
  const document = await ctx.db.get(expenseDocumentId);

  if (!document || document.userId !== userId || document.deletedAt) {
    throw new Error("EXPENSE_DOCUMENT_NOT_FOUND");
  }

  return document;
}

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireSignedInUserId(ctx);
    const documents = await ctx.db
      .query("expenseDocuments")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    const activeDocuments = documents.filter((document) => !document.deletedAt);

    return Promise.all(
      activeDocuments.map(async (document) => {
        const attachments = await ctx.db
          .query("expenseDocumentAttachments")
          .withIndex("expenseDocumentId", (q) =>
            q.eq("expenseDocumentId", document._id)
          )
          .collect();

        const primaryAttachment = document.primaryAttachmentId
          ? await ctx.db.get(document.primaryAttachmentId)
          : null;

        return {
          ...document,
          attachments,
          primaryAttachment,
        };
      })
    );
  },
});

export const ingestCreateExpenseDocument = internalMutation({
  args: {
    userId: v.id("users"),
    fromEmail: v.optional(v.string()),
    subject: v.optional(v.string()),
    receivedAt: v.number(),
    messageId: v.optional(v.string()),
    dedupeKey: v.string(),
    originFromEmail: v.optional(v.string()),
    originFromName: v.optional(v.string()),
    originDomain: v.optional(v.string()),
    originSubject: v.optional(v.string()),
    originSentAt: v.optional(v.number()),
    rawEmailMetadata: v.optional(v.any()),
    attachments: v.array(attachmentArgs),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("expenseDocuments")
      .withIndex("dedupeKey", (q) => q.eq("dedupeKey", args.dedupeKey))
      .first();

    if (existing) {
      return existing._id;
    }

    const acceptableAttachments = getAcceptedPdfAttachments(
      args.attachments.map((attachment) => ({
        ...attachment,
        filename: attachment.originalFilename,
      }))
    );

    if (acceptableAttachments.length === 0) {
      throw new Error("NO_ACCEPTABLE_PDFS");
    }

    const now = Date.now();
    const expenseDocumentId = await ctx.db.insert("expenseDocuments", {
      userId: args.userId,
      fromEmail: args.fromEmail,
      subject: args.subject,
      receivedAt: args.receivedAt,
      messageId: args.messageId,
      dedupeKey: args.dedupeKey,
      originFromEmail: args.originFromEmail,
      originFromName: args.originFromName,
      originDomain: args.originDomain,
      originSubject: args.originSubject,
      originSentAt: args.originSentAt,
      rawEmailMetadata: args.rawEmailMetadata,
      createdAt: now,
    });

    const insertedAttachments = await Promise.all(
      acceptableAttachments.map(async (attachment) => {
        const attachmentId = await ctx.db.insert("expenseDocumentAttachments", {
          expenseDocumentId,
          originalFilename: attachment.originalFilename,
          mimeType: attachment.mimeType,
          fileSize: attachment.fileSize,
          fileUrl: attachment.fileUrl,
          fileStorageId: attachment.fileStorageId,
          attachmentId: attachment.attachmentId,
          originalOrder: attachment.originalOrder,
          createdAt: now,
        });

        return { ...attachment, _id: attachmentId };
      })
    );

    const primary = choosePrimaryAttachment(
      insertedAttachments.map((attachment) => ({
        ...attachment,
        filename: attachment.originalFilename,
      }))
    );

    if (primary) {
      await ctx.db.patch(expenseDocumentId, {
        primaryAttachmentId: primary._id,
      });
    }

    return expenseDocumentId;
  },
});

export const setPrimaryAttachment = mutation({
  args: {
    expenseDocumentId: v.id("expenseDocuments"),
    attachmentId: v.id("expenseDocumentAttachments"),
  },
  handler: async (ctx, args) => {
    await getOwnedExpenseDocument(ctx, args.expenseDocumentId);
    const attachment = await ctx.db.get(args.attachmentId);

    if (
      !attachment ||
      attachment.expenseDocumentId !== args.expenseDocumentId
    ) {
      throw new Error("ATTACHMENT_NOT_FOUND");
    }

    await ctx.db.patch(args.expenseDocumentId, {
      primaryAttachmentId: args.attachmentId,
    });
  },
});

export const softDelete = mutation({
  args: {
    expenseDocumentId: v.id("expenseDocuments"),
  },
  handler: async (ctx, args) => {
    await getOwnedExpenseDocument(ctx, args.expenseDocumentId);
    await ctx.db.patch(args.expenseDocumentId, {
      deletedAt: Date.now(),
    });
  },
});
