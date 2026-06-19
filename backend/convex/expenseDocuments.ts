import { getAuthUserId } from "@convex-dev/auth/server";
import {
  isCollectionMonth,
  isTimestampInCollectionMonth,
  shiftCollectionMonth,
  summarizeAccountantExportContents,
} from "@mailtobills/types";
import { v } from "convex/values";

import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { writeCollectedExpenseDocument } from "./lib/collectedExpenseDocumentWriter";

import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type {
  CollectionMonthExpenseDocuments,
  ExpenseDocumentAttachment,
  ExpenseDocumentRow,
  ExpenseDocumentSummary,
} from "@mailtobills/types";

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

async function projectCollectedExpenseDocument(
  ctx: Pick<QueryCtx, "db">,
  document: Doc<"expenseDocuments">,
) {
  const attachments = await ctx.db
    .query("expenseDocumentAttachments")
    .withIndex("expenseDocumentId", (q) =>
      q.eq("expenseDocumentId", document._id),
    )
    .collect();

  const orderedAttachments = attachments
    .slice()
    .sort((a, b) => a.originalOrder - b.originalOrder);

  const primaryAttachment =
    orderedAttachments.find(
      (attachment) => attachment._id === document.primaryAttachmentId,
    ) ?? null;

  return {
    _id: document._id,
    _creationTime: document._creationTime,
    userId: document.userId,
    fromEmail: document.fromEmail,
    subject: document.subject,
    messageId: document.messageId,
    receivedAt: document.receivedAt,
    createdAt: document.createdAt,
    deletedAt: document.deletedAt,
    dedupeKey: document.dedupeKey,
    primaryAttachmentId: document.primaryAttachmentId,
    originFromEmail: document.originFromEmail,
    originFromName: document.originFromName,
    originDomain: document.originDomain,
    originSubject: document.originSubject,
    originSentAt: document.originSentAt,
    attachments: orderedAttachments,
    primaryAttachment,
  };
}

async function listActiveProjectedExpenseDocuments(
  ctx: Pick<QueryCtx, "db">,
  userId: Id<"users">,
) {
  const documents = await ctx.db
    .query("expenseDocuments")
    .withIndex("userId", (q) => q.eq("userId", userId))
    .collect();

  const activeDocuments = documents.filter((document) => !document.deletedAt);

  return await Promise.all(
    activeDocuments.map((document) =>
      projectCollectedExpenseDocument(ctx, document),
    ),
  );
}

function toExpenseDocumentAttachment(
  attachment: Doc<"expenseDocumentAttachments">,
): ExpenseDocumentAttachment {
  return {
    id: attachment._id,
    expenseDocumentId: attachment.expenseDocumentId,
    originalFilename: attachment.originalFilename,
    mimeType: attachment.mimeType,
    fileSize: attachment.fileSize,
    fileUrl: attachment.fileUrl,
    fileStorageId: attachment.fileStorageId,
    attachmentId: attachment.attachmentId,
    originalOrder: attachment.originalOrder,
    createdAt: attachment.createdAt,
  };
}

type ProjectedCollectedExpenseDocument = Awaited<
  ReturnType<typeof projectCollectedExpenseDocument>
>;

function toExpenseDocumentRow(
  document: ProjectedCollectedExpenseDocument,
): ExpenseDocumentRow {
  const attachments = document.attachments.map(toExpenseDocumentAttachment);
  const primaryAttachment = document.primaryAttachment
    ? toExpenseDocumentAttachment(document.primaryAttachment)
    : undefined;

  return {
    id: document._id,
    userId: document.userId,
    fromEmail: document.fromEmail,
    subject: document.subject,
    messageId: document.messageId,
    receivedAt: document.receivedAt,
    createdAt: document.createdAt,
    deletedAt: document.deletedAt,
    dedupeKey: document.dedupeKey,
    primaryAttachmentId: document.primaryAttachmentId,
    originFromEmail: document.originFromEmail,
    originFromName: document.originFromName,
    originDomain: document.originDomain,
    originSubject: document.originSubject,
    originSentAt: document.originSentAt,
    attachments,
    primaryAttachment,
  };
}

function expenseDocumentRowsForCollectionMonth(
  documents: ProjectedCollectedExpenseDocument[],
  month: string,
) {
  return documents
    .filter((document) =>
      isTimestampInCollectionMonth(document.receivedAt, month),
    )
    .sort((a, b) => b.receivedAt - a.receivedAt)
    .map(toExpenseDocumentRow);
}

function summarizeExpenseDocumentRows(
  documents: ExpenseDocumentRow[],
): ExpenseDocumentSummary {
  return {
    count: documents.length,
    attachmentCount: documents.reduce(
      (total, document) => total + document.attachments.length,
      0,
    ),
  };
}

function summarizeAccountantExportRows(documents: ExpenseDocumentRow[]) {
  return summarizeAccountantExportContents(
    documents.map((document) => ({
      id: document.id,
      primaryAttachment: document.primaryAttachment,
    })),
  );
}

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireSignedInUserId(ctx);
    return await listActiveProjectedExpenseDocuments(ctx, userId);
  },
});

export const getCollectionMonthDashboard = query({
  args: {
    month: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<CollectionMonthExpenseDocuments> => {
    if (!isCollectionMonth(args.month)) {
      throw new Error("INVALID_COLLECTION_MONTH");
    }

    const userId = await requireSignedInUserId(ctx);
    const documents = await listActiveProjectedExpenseDocuments(ctx, userId);
    const rows = expenseDocumentRowsForCollectionMonth(documents, args.month);
    const previousRows = expenseDocumentRowsForCollectionMonth(
      documents,
      shiftCollectionMonth(args.month, -1),
    );

    return {
      documents: rows,
      summary: summarizeExpenseDocumentRows(rows),
      previousSummary: summarizeExpenseDocumentRows(previousRows),
      exportSummary: summarizeAccountantExportRows(rows),
      previousExportSummary: summarizeAccountantExportRows(previousRows),
      totalCount: documents.length,
    };
  },
});

export const createDemoExpenseDocument = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireSignedInUserId(ctx);
    const now = Date.now();

    return await writeCollectedExpenseDocument(ctx, {
      userId,
      fromEmail: "billing@example.com",
      subject: "Demo expense document",
      receivedAt: now,
      dedupeKey: `${userId}|demo|${now}|${crypto.randomUUID()}`,
      attachments: [
        {
          originalFilename: "mailtobills-demo-receipt.pdf",
          mimeType: "application/pdf",
          fileUrl:
            "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          originalOrder: 0,
        },
      ],
    });
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
    return await writeCollectedExpenseDocument(ctx, {
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
      attachments: args.attachments,
    });
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

export const getOwnedAttachmentForDownload = internalQuery({
  args: {
    userId: v.id("users"),
    attachmentId: v.id("expenseDocumentAttachments"),
  },
  handler: async (ctx, args) => {
    const attachment = await ctx.db.get(args.attachmentId);

    if (!attachment) {
      return null;
    }

    const document = await ctx.db.get(attachment.expenseDocumentId);

    if (
      !document ||
      document.userId !== args.userId ||
      document.deletedAt
    ) {
      return null;
    }

    return {
      attachment,
      document,
    };
  },
});

export const listForAccountantExport = internalQuery({
  args: {
    userId: v.id("users"),
    month: v.string(),
  },
  handler: async (ctx, args) => {
    if (!isCollectionMonth(args.month)) {
      throw new Error("INVALID_COLLECTION_MONTH");
    }

    const documents = await ctx.db
      .query("expenseDocuments")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();

    const activeDocuments = documents
      .filter(
        (document) =>
          !document.deletedAt &&
          isTimestampInCollectionMonth(document.receivedAt, args.month),
      )
      .sort((a, b) => a.receivedAt - b.receivedAt);

    return Promise.all(
      activeDocuments.map((document) =>
        projectCollectedExpenseDocument(ctx, document),
      ),
    );
  },
});
