import { describe, expect, it } from "vitest";

import {
  addExpenseDocumentDownloadUrls,
  percentDelta,
} from "./transform";

describe("expense document dashboard adapters", () => {
  it("adds Next download URLs to each attachment and the resolved Primary Attachment", () => {
    const result = addExpenseDocumentDownloadUrls({
      documents: [
        {
          id: "doc-1",
          userId: "user-1",
          receivedAt: Date.UTC(2026, 0, 8),
          createdAt: Date.UTC(2026, 0, 8),
          dedupeKey: "doc-1",
          primaryAttachmentId: "attachment-2",
          attachments: [
            {
              id: "attachment-1",
              expenseDocumentId: "doc-1",
              originalFilename: "terms.pdf",
              originalOrder: 0,
              createdAt: Date.UTC(2026, 0, 8),
            },
            {
              id: "attachment-2",
              expenseDocumentId: "doc-1",
              originalFilename: "invoice.pdf",
              originalOrder: 1,
              createdAt: Date.UTC(2026, 0, 8),
            },
          ],
          primaryAttachment: {
            id: "attachment-2",
            expenseDocumentId: "doc-1",
            originalFilename: "invoice.pdf",
            originalOrder: 1,
            createdAt: Date.UTC(2026, 0, 8),
          },
        },
      ],
      summary: { count: 1, attachmentCount: 2 },
      previousSummary: { count: 0, attachmentCount: 0 },
      exportSummary: {
        includedDocumentCount: 1,
        pdfFileCount: 1,
        manifestFileCount: 1,
        fileCount: 2,
        skippedDocumentCount: 0,
        skippedDocuments: [],
      },
      previousExportSummary: {
        includedDocumentCount: 0,
        pdfFileCount: 0,
        manifestFileCount: 1,
        fileCount: 1,
        skippedDocumentCount: 0,
        skippedDocuments: [],
      },
      totalCount: 1,
    });

    expect(result.documents[0]?.attachments.map((item) => item.downloadUrl)).toEqual([
      "/api/files/attachment-1",
      "/api/files/attachment-2",
    ]);
    expect(result.documents[0]?.primaryAttachment?.downloadUrl).toBe(
      "/api/files/attachment-2",
    );
  });

  it("calculates percentage deltas with empty previous period semantics", () => {
    expect(percentDelta(0, 0)).toBe(0);
    expect(percentDelta(3, 0)).toBeNull();
    expect(percentDelta(15, 10)).toBe(50);
    expect(percentDelta(5, 10)).toBe(-50);
  });
});
