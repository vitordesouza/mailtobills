import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";

const expenseDocuments = defineTable({
  userId: v.id("users"),
  fromEmail: v.optional(v.string()),
  subject: v.optional(v.string()),
  messageId: v.optional(v.string()),
  receivedAt: v.number(),
  createdAt: v.number(),
  deletedAt: v.optional(v.number()),
  dedupeKey: v.string(),
  primaryAttachmentId: v.optional(v.id("expenseDocumentAttachments")),
  originFromEmail: v.optional(v.string()),
  originFromName: v.optional(v.string()),
  originDomain: v.optional(v.string()),
  originSubject: v.optional(v.string()),
  originSentAt: v.optional(v.number()),
  rawEmailMetadata: v.optional(v.any()),
})
  .index("userId", ["userId"])
  .index("dedupeKey", ["dedupeKey"]);

const expenseDocumentAttachments = defineTable({
  expenseDocumentId: v.id("expenseDocuments"),
  originalFilename: v.string(),
  mimeType: v.optional(v.string()),
  fileSize: v.optional(v.number()),
  fileUrl: v.optional(v.string()), // URL no storage (S3/Hetzner) – v1
  fileStorageId: v.optional(v.id("_storage")),
  attachmentId: v.optional(v.string()),
  originalOrder: v.number(),
  createdAt: v.number(),
})
  .index("expenseDocumentId", ["expenseDocumentId"])
  .index("fileStorageId", ["fileStorageId"]);

const invoices = defineTable({
  userId: v.id("users"),
  originalFilename: v.string(),
  fileUrl: v.optional(v.string()), // URL no storage (S3/Hetzner) – v1
  fileStorageId: v.optional(v.id("_storage")),
  fromEmail: v.optional(v.string()),
  originFromEmail: v.optional(v.string()),
  originFromName: v.optional(v.string()),
  originDomain: v.optional(v.string()),
  originSubject: v.optional(v.string()),
  originSentAt: v.optional(v.number()),
  subject: v.optional(v.string()),
  messageId: v.optional(v.string()),
  attachmentId: v.optional(v.string()),
  receivedAt: v.number(), // timestamp do email
  createdAt: v.number(), // timestamp de criação no sistema
  dedupeKey: v.string(),
})
  .index("userId", ["userId"])
  .index("dedupeKey", ["dedupeKey"]);

const users = defineTable({
  name: v.optional(v.string()),
  image: v.optional(v.string()),
  email: v.optional(v.string()),
  emailVerificationTime: v.optional(v.number()),
  phone: v.optional(v.string()),
  phoneVerificationTime: v.optional(v.number()),
  isAnonymous: v.optional(v.boolean()),
  // custom fields below
  forwardingEmails: v.optional(v.array(v.string())),
})
  .index("email", ["email"])
  .index("phone", ["phone"])
  // custom indexes below
  .index("forwardingEmails", ["forwardingEmails"]);

export default defineSchema({
  ...authTables,
  users,
  expenseDocuments,
  expenseDocumentAttachments,
  invoices,
});
