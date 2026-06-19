/// <reference types="vitest/importMeta" />

import { convexTest } from "convex-test";
import type { TestConvex } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = (
  import.meta as ImportMeta & {
    glob(patterns: string[]): Record<string, () => Promise<unknown>>;
  }
).glob(["./**/*.*s", "!./**/*.test.ts"]);

async function insertUser(
  t: TestConvex<typeof schema>,
  email: string,
) {
  return t.run((ctx) =>
    ctx.db.insert("users", {
      email,
    }),
  );
}

function asIdentity(userId: Id<"users">) {
  return {
    subject: `${userId}|test-session`,
    email: "user@example.com",
  };
}

describe("expense document Convex functions", () => {
  it("ingests acceptable PDFs, ignores non-PDF attachments, and chooses a primary attachment", async () => {
    const t = convexTest({ schema, modules });
    const userId = await insertUser(t, "owner@example.com");

    const documentId = await t.mutation(
      internal.expenseDocuments.ingestCreateExpenseDocument,
      {
        userId,
        fromEmail: "forwarder@example.com",
        subject: "Forwarded invoice",
        receivedAt: Date.UTC(2026, 0, 5),
        dedupeKey: "owner|message-1",
        attachments: [
          {
            originalFilename: "terms.pdf",
            mimeType: "application/pdf",
            fileSize: 900_000,
            fileUrl: "https://example.com/terms.pdf",
            originalOrder: 0,
          },
          {
            originalFilename: "fatura-2026-01.pdf",
            mimeType: "application/pdf",
            fileSize: 100_000,
            fileUrl: "https://example.com/fatura.pdf",
            originalOrder: 1,
          },
          {
            originalFilename: "logo.png",
            mimeType: "image/png",
            fileSize: 5_000,
            fileUrl: "https://example.com/logo.png",
            originalOrder: 2,
          },
        ],
      },
    );

    const stored = await t.run(async (ctx) => {
      const document = await ctx.db.get(documentId);
      const attachments = await ctx.db
        .query("expenseDocumentAttachments")
        .withIndex("expenseDocumentId", (q) =>
          q.eq("expenseDocumentId", documentId),
        )
        .collect();
      return { document, attachments };
    });

    expect(stored.attachments.map((item) => item.originalFilename)).toEqual([
      "terms.pdf",
      "fatura-2026-01.pdf",
    ]);
    expect(stored.document?.primaryAttachmentId).toBe(
      stored.attachments.find(
        (item) => item.originalFilename === "fatura-2026-01.pdf",
      )?._id,
    );
  });

  it("deduplicates ingest requests and rejects messages without acceptable PDFs", async () => {
    const t = convexTest({ schema, modules });
    const userId = await insertUser(t, "owner@example.com");
    const args = {
      userId,
      receivedAt: Date.UTC(2026, 0, 5),
      dedupeKey: "owner|message-1",
      attachments: [
        {
          originalFilename: "invoice.pdf",
          mimeType: "application/pdf",
          originalOrder: 0,
        },
      ],
    };

    const first = await t.mutation(
      internal.expenseDocuments.ingestCreateExpenseDocument,
      args,
    );
    const second = await t.mutation(
      internal.expenseDocuments.ingestCreateExpenseDocument,
      args,
    );

    await expect(
      t.mutation(internal.expenseDocuments.ingestCreateExpenseDocument, {
        userId,
        receivedAt: Date.UTC(2026, 0, 6),
        dedupeKey: "owner|message-2",
        attachments: [
          {
            originalFilename: "logo.png",
            mimeType: "image/png",
            originalOrder: 0,
          },
        ],
      }),
    ).rejects.toThrow("NO_ACCEPTABLE_PDFS");
    expect(second).toBe(first);
  });

  it("creates demo documents for the signed-in user and hides soft-deleted documents", async () => {
    const t = convexTest({ schema, modules });
    const userId = await insertUser(t, "owner@example.com");
    const authed = t.withIdentity(asIdentity(userId));

    const documentId = await authed.mutation(
      api.expenseDocuments.createDemoExpenseDocument,
    );
    expect(await authed.query(api.expenseDocuments.listMine)).toHaveLength(1);

    await authed.mutation(api.expenseDocuments.createDemoExpenseDocument);
    expect(await authed.query(api.expenseDocuments.listMine)).toHaveLength(2);

    await authed.mutation(api.expenseDocuments.softDelete, {
      expenseDocumentId: documentId,
    });

    expect(await authed.query(api.expenseDocuments.listMine)).toHaveLength(1);
  });

  it("rejects primary attachment changes for attachments from another document", async () => {
    const t = convexTest({ schema, modules });
    const userId = await insertUser(t, "owner@example.com");
    const authed = t.withIdentity(asIdentity(userId));
    const firstDocumentId = await authed.mutation(
      api.expenseDocuments.createDemoExpenseDocument,
    );
    const secondDocumentId = await authed.mutation(
      api.expenseDocuments.createDemoExpenseDocument,
    );
    const secondAttachmentId = await t.run(async (ctx) => {
      const attachments = await ctx.db
        .query("expenseDocumentAttachments")
        .withIndex("expenseDocumentId", (q) =>
          q.eq("expenseDocumentId", secondDocumentId),
        )
        .collect();
      return attachments[0]?._id;
    });

    await expect(
      authed.mutation(api.expenseDocuments.setPrimaryAttachment, {
        expenseDocumentId: firstDocumentId,
        attachmentId: secondAttachmentId as Id<"expenseDocumentAttachments">,
      }),
    ).rejects.toThrow("ATTACHMENT_NOT_FOUND");
  });

  it("projects collected expense documents with ordered attachments and resolved primary attachment", async () => {
    const t = convexTest({ schema, modules });
    const userId = await insertUser(t, "owner@example.com");
    const receivedAt = Date.UTC(2026, 0, 10);
    const documentId = await t.run((ctx) =>
      ctx.db.insert("expenseDocuments", {
        userId,
        fromEmail: "forwarder@example.com",
        subject: "January receipts",
        receivedAt,
        createdAt: receivedAt,
        dedupeKey: "owner|projection",
      }),
    );
    const secondAttachmentId = await t.run((ctx) =>
      ctx.db.insert("expenseDocumentAttachments", {
        expenseDocumentId: documentId,
        originalFilename: "second.pdf",
        mimeType: "application/pdf",
        fileUrl: "https://example.com/second.pdf",
        originalOrder: 2,
        createdAt: receivedAt,
      }),
    );
    const firstAttachmentId = await t.run((ctx) =>
      ctx.db.insert("expenseDocumentAttachments", {
        expenseDocumentId: documentId,
        originalFilename: "first.pdf",
        mimeType: "application/pdf",
        fileUrl: "https://example.com/first.pdf",
        originalOrder: 1,
        createdAt: receivedAt,
      }),
    );

    await t.run((ctx) =>
      ctx.db.patch(documentId, {
        primaryAttachmentId: firstAttachmentId,
      }),
    );

    const authed = t.withIdentity(asIdentity(userId));
    const mine = await authed.query(api.expenseDocuments.listMine);
    const exportDocuments = await t.query(
      internal.expenseDocuments.listForAccountantExport,
      {
        userId,
        month: "2026-01",
      },
    );

    expect(mine[0]?.attachments.map((item) => item._id)).toEqual([
      firstAttachmentId,
      secondAttachmentId,
    ]);
    expect(mine[0]?.primaryAttachment?._id).toBe(firstAttachmentId);
    expect(exportDocuments[0]?.attachments.map((item) => item._id)).toEqual([
      firstAttachmentId,
      secondAttachmentId,
    ]);
    expect(exportDocuments[0]?.primaryAttachment?._id).toBe(firstAttachmentId);
  });

  it("scopes download lookup and accountant export listing by owner and month", async () => {
    const t = convexTest({ schema, modules });
    const ownerId = await insertUser(t, "owner@example.com");
    const otherId = await insertUser(t, "other@example.com");
    const documentId = await t.mutation(
      internal.expenseDocuments.ingestCreateExpenseDocument,
      {
        userId: ownerId,
        subject: "January invoice",
        receivedAt: Date.UTC(2026, 0, 10),
        dedupeKey: "owner|january",
        attachments: [
          {
            originalFilename: "invoice.pdf",
            mimeType: "application/pdf",
            fileUrl: "https://example.com/invoice.pdf",
            originalOrder: 0,
          },
        ],
      },
    );
    const attachmentId = await t.run(async (ctx) => {
      const document = await ctx.db.get(documentId);
      return document?.primaryAttachmentId;
    });

    const ownerDownload = await t.query(
      internal.expenseDocuments.getOwnedAttachmentForDownload,
      {
        userId: ownerId,
        attachmentId: attachmentId as Id<"expenseDocumentAttachments">,
      },
    );
    const otherDownload = await t.query(
      internal.expenseDocuments.getOwnedAttachmentForDownload,
      {
        userId: otherId,
        attachmentId: attachmentId as Id<"expenseDocumentAttachments">,
      },
    );
    const januaryExport = await t.query(
      internal.expenseDocuments.listForAccountantExport,
      {
        userId: ownerId,
        month: "2026-01",
      },
    );
    const februaryExport = await t.query(
      internal.expenseDocuments.listForAccountantExport,
      {
        userId: ownerId,
        month: "2026-02",
      },
    );

    expect(ownerDownload?.attachment._id).toBe(attachmentId);
    expect(otherDownload).toBeNull();
    expect(januaryExport).toHaveLength(1);
    expect(januaryExport[0]?.primaryAttachment?._id).toBe(attachmentId);
    expect(februaryExport).toHaveLength(0);
  });

  it("returns Collection Month dashboard data from one deep query", async () => {
    const t = convexTest({ schema, modules });
    const userId = await insertUser(t, "owner@example.com");
    const authed = t.withIdentity(asIdentity(userId));

    const januaryOlderId = await t.run((ctx) =>
      ctx.db.insert("expenseDocuments", {
        userId,
        fromEmail: "forwarder@example.com",
        subject: "January older",
        receivedAt: Date.UTC(2026, 0, 8),
        createdAt: Date.UTC(2026, 0, 8),
        dedupeKey: "owner|january-older",
      }),
    );
    const januarySecondAttachmentId = await t.run((ctx) =>
      ctx.db.insert("expenseDocumentAttachments", {
        expenseDocumentId: januaryOlderId,
        originalFilename: "second.pdf",
        mimeType: "application/pdf",
        originalOrder: 2,
        createdAt: Date.UTC(2026, 0, 8),
      }),
    );
    const januaryFirstAttachmentId = await t.run((ctx) =>
      ctx.db.insert("expenseDocumentAttachments", {
        expenseDocumentId: januaryOlderId,
        originalFilename: "first.pdf",
        mimeType: "application/pdf",
        originalOrder: 1,
        createdAt: Date.UTC(2026, 0, 8),
      }),
    );
    await t.run((ctx) =>
      ctx.db.patch(januaryOlderId, {
        primaryAttachmentId: januaryFirstAttachmentId,
      }),
    );

    const januaryWithoutPrimaryId = await t.run((ctx) =>
      ctx.db.insert("expenseDocuments", {
        userId,
        fromEmail: "forwarder@example.com",
        subject: "January missing primary",
        receivedAt: Date.UTC(2026, 0, 10),
        createdAt: Date.UTC(2026, 0, 10),
        dedupeKey: "owner|january-missing-primary",
      }),
    );
    await t.run((ctx) =>
      ctx.db.insert("expenseDocumentAttachments", {
        expenseDocumentId: januaryWithoutPrimaryId,
        originalFilename: "fallback.pdf",
        mimeType: "application/pdf",
        originalOrder: 0,
        createdAt: Date.UTC(2026, 0, 10),
      }),
    );

    const decemberId = await t.run((ctx) =>
      ctx.db.insert("expenseDocuments", {
        userId,
        receivedAt: Date.UTC(2025, 11, 5),
        createdAt: Date.UTC(2025, 11, 5),
        dedupeKey: "owner|december",
      }),
    );
    const decemberAttachmentId = await t.run((ctx) =>
      ctx.db.insert("expenseDocumentAttachments", {
        expenseDocumentId: decemberId,
        originalFilename: "december.pdf",
        mimeType: "application/pdf",
        originalOrder: 0,
        createdAt: Date.UTC(2025, 11, 5),
      }),
    );
    await t.run((ctx) =>
      ctx.db.patch(decemberId, {
        primaryAttachmentId: decemberAttachmentId,
      }),
    );

    await t.mutation(internal.expenseDocuments.ingestCreateExpenseDocument, {
      userId,
      receivedAt: Date.UTC(2026, 1, 1),
      dedupeKey: "owner|february",
      attachments: [
        {
          originalFilename: "february.pdf",
          mimeType: "application/pdf",
          originalOrder: 0,
        },
      ],
    });
    const deletedId = await t.mutation(
      internal.expenseDocuments.ingestCreateExpenseDocument,
      {
        userId,
        receivedAt: Date.UTC(2026, 0, 15),
        dedupeKey: "owner|deleted",
        attachments: [
          {
            originalFilename: "deleted.pdf",
            mimeType: "application/pdf",
            originalOrder: 0,
          },
        ],
      },
    );
    await t.run((ctx) =>
      ctx.db.patch(deletedId, {
        deletedAt: Date.UTC(2026, 0, 16),
      }),
    );

    const result = await authed.query(
      api.expenseDocuments.getCollectionMonthDashboard,
      { month: "2026-01" },
    );

    expect(result.documents.map((document) => document.id)).toEqual([
      januaryWithoutPrimaryId,
      januaryOlderId,
    ]);
    expect(result.documents[1]?.attachments.map((item) => item.id)).toEqual([
      januaryFirstAttachmentId,
      januarySecondAttachmentId,
    ]);
    expect(result.documents[1]?.primaryAttachment?.id).toBe(
      januaryFirstAttachmentId,
    );
    expect(result.documents[0]?.primaryAttachment).toBeUndefined();
    expect(result.summary).toEqual({ count: 2, attachmentCount: 3 });
    expect(result.previousSummary).toEqual({
      count: 1,
      attachmentCount: 1,
    });
    expect(result.exportSummary).toEqual({
      includedDocumentCount: 1,
      pdfFileCount: 1,
      manifestFileCount: 1,
      fileCount: 2,
      skippedDocumentCount: 1,
      skippedDocuments: [
        {
          id: januaryWithoutPrimaryId,
          reason: "missing_primary_attachment",
        },
      ],
    });
    expect(result.previousExportSummary.includedDocumentCount).toBe(1);
    expect(result.totalCount).toBe(4);
  });
});
