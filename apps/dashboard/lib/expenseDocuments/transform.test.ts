import { describe, expect, it } from "vitest";

import type { MonthInfo } from "../months";
import {
  expenseDocumentRowsForMonth,
  percentDelta,
  summarizeExpenseDocuments,
} from "./transform";

const january: MonthInfo = {
  value: "2026-01",
  label: "January 2026",
  start: new Date(Date.UTC(2026, 0, 1)),
  end: new Date(Date.UTC(2026, 1, 1) - 1),
  previous: "2025-12",
  next: "2026-02",
};

function attachment(
  id: string,
  originalOrder: number,
  originalFilename = `${id}.pdf`,
) {
  return {
    _id: id,
    expenseDocumentId: "doc-1",
    originalFilename,
    mimeType: "application/pdf",
    fileSize: 100_000,
    fileUrl: null,
    fileStorageId: null,
    attachmentId: null,
    originalOrder,
    createdAt: Date.UTC(2026, 0, 5),
  };
}

describe("expense document transforms", () => {
  it("filters by month, sorts documents newest first, and sorts attachments by original order", () => {
    const rows = expenseDocumentRowsForMonth(
      [
        {
          _id: "older",
          userId: "user-1",
          fromEmail: "forwarder@example.com",
          subject: null,
          messageId: null,
          receivedAt: Date.UTC(2026, 0, 4),
          createdAt: Date.UTC(2026, 0, 4),
          deletedAt: null,
          dedupeKey: "older",
          primaryAttachmentId: "attachment-b",
          originFromEmail: "billing@example.com",
          originFromName: null,
          originDomain: null,
          originSubject: null,
          originSentAt: null,
          attachments: [attachment("attachment-c", 2), attachment("attachment-b", 1)],
          primaryAttachment: null,
        },
        {
          _id: "outside-month",
          userId: "user-1",
          receivedAt: Date.UTC(2026, 1, 1),
          createdAt: Date.UTC(2026, 1, 1),
          dedupeKey: "outside-month",
          attachments: [attachment("attachment-d", 0)],
        },
        {
          _id: "newer",
          userId: "user-1",
          receivedAt: Date.UTC(2026, 0, 8),
          createdAt: Date.UTC(2026, 0, 8),
          dedupeKey: "newer",
          attachments: [attachment("attachment-a", 0)],
        },
      ],
      january,
    );

    expect(rows.map((row) => row.id)).toEqual(["newer", "older"]);
    expect(rows[1]?.attachments.map((item) => item.id)).toEqual([
      "attachment-b",
      "attachment-c",
    ]);
    expect(rows[1]?.primaryAttachment?.id).toBe("attachment-b");
    expect(rows[1]?.originFromEmail).toBe("billing@example.com");
    expect(rows[1]?.subject).toBeUndefined();
  });

  it("falls back to Convex primary attachment and then first attachment", () => {
    const rows = expenseDocumentRowsForMonth(
      [
        {
          _id: "convex-primary",
          userId: "user-1",
          receivedAt: Date.UTC(2026, 0, 8),
          createdAt: Date.UTC(2026, 0, 8),
          dedupeKey: "convex-primary",
          attachments: [attachment("first", 0), attachment("second", 1)],
          primaryAttachment: attachment("second", 1),
        },
        {
          _id: "first-fallback",
          userId: "user-1",
          receivedAt: Date.UTC(2026, 0, 7),
          createdAt: Date.UTC(2026, 0, 7),
          dedupeKey: "first-fallback",
          attachments: [attachment("fallback", 0)],
        },
      ],
      january,
    );

    expect(rows[0]?.primaryAttachment?.id).toBe("second");
    expect(rows[1]?.primaryAttachment?.id).toBe("fallback");
  });

  it("summarizes document and attachment counts", () => {
    const rows = expenseDocumentRowsForMonth(
      [
        {
          _id: "doc-1",
          userId: "user-1",
          receivedAt: Date.UTC(2026, 0, 1),
          createdAt: Date.UTC(2026, 0, 1),
          dedupeKey: "doc-1",
          attachments: [attachment("a", 0), attachment("b", 1)],
        },
      ],
      january,
    );

    expect(summarizeExpenseDocuments(rows)).toEqual({
      count: 1,
      attachmentCount: 2,
    });
  });

  it("calculates percentage deltas with empty previous period semantics", () => {
    expect(percentDelta(0, 0)).toBe(0);
    expect(percentDelta(3, 0)).toBeNull();
    expect(percentDelta(15, 10)).toBe(50);
    expect(percentDelta(5, 10)).toBe(-50);
  });
});
