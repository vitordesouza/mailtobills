import {
  choosePrimaryAttachment,
  getAcceptedPdfAttachments,
} from "@mailtobills/domain";

import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export type CollectedExpenseDocumentAttachmentInput = {
  originalFilename: string;
  mimeType?: string;
  fileSize?: number;
  fileUrl?: string;
  fileStorageId?: Id<"_storage">;
  attachmentId?: string;
  originalOrder: number;
};

export type CollectedExpenseDocumentInput = {
  userId: Id<"users">;
  fromEmail?: string;
  subject?: string;
  receivedAt: number;
  messageId?: string;
  dedupeKey: string;
  originFromEmail?: string;
  originFromName?: string;
  originDomain?: string;
  originSubject?: string;
  originSentAt?: number;
  rawEmailMetadata?: unknown;
  attachments: CollectedExpenseDocumentAttachmentInput[];
};

export async function writeCollectedExpenseDocument(
  ctx: Pick<MutationCtx, "db">,
  input: CollectedExpenseDocumentInput,
) {
  const existing = await ctx.db
    .query("expenseDocuments")
    .withIndex("dedupeKey", (q) => q.eq("dedupeKey", input.dedupeKey))
    .first();

  if (existing) {
    return existing._id;
  }

  const acceptableAttachments = getAcceptedPdfAttachments(
    input.attachments.map((attachment) => ({
      ...attachment,
      filename: attachment.originalFilename,
    })),
  );

  if (acceptableAttachments.length === 0) {
    throw new Error("NO_ACCEPTABLE_PDFS");
  }

  const now = Date.now();
  const expenseDocumentId = await ctx.db.insert("expenseDocuments", {
    userId: input.userId,
    fromEmail: input.fromEmail,
    subject: input.subject,
    receivedAt: input.receivedAt,
    messageId: input.messageId,
    dedupeKey: input.dedupeKey,
    originFromEmail: input.originFromEmail,
    originFromName: input.originFromName,
    originDomain: input.originDomain,
    originSubject: input.originSubject,
    originSentAt: input.originSentAt,
    rawEmailMetadata: input.rawEmailMetadata,
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
    }),
  );

  const primary = choosePrimaryAttachment(
    insertedAttachments.map((attachment) => ({
      ...attachment,
      filename: attachment.originalFilename,
    })),
  );

  if (primary) {
    await ctx.db.patch(expenseDocumentId, {
      primaryAttachmentId: primary._id,
    });
  }

  return expenseDocumentId;
}
