import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  choosePrimaryAttachment,
  getAcceptedPdfAttachments,
  scoreAttachmentCandidate,
} from "./primaryAttachment.js";

describe("primary attachment selection", () => {
  it("accepts only PDF candidates", () => {
    const candidates = [
      {
        filename: "receipt.pdf",
        mimeType: "application/pdf",
        fileSize: 100_000,
        originalOrder: 0,
      },
      {
        filename: "signature.png",
        mimeType: "image/png",
        fileSize: 10_000,
        originalOrder: 1,
      },
    ];

    assert.deepEqual(getAcceptedPdfAttachments(candidates), [candidates[0]]);
  });

  it("accepts a PDF filename when the MIME type is generic", () => {
    const candidates = [
      {
        filename: "bill.pdf",
        mimeType: "application/octet-stream",
        fileSize: 100_000,
        originalOrder: 0,
      },
      {
        filename: "scan.png",
        mimeType: "application/pdf",
        fileSize: 100_000,
        originalOrder: 1,
      },
    ];

    assert.deepEqual(getAcceptedPdfAttachments(candidates), candidates);
  });

  it("prefers application/pdf over a filename-only PDF when otherwise similar", () => {
    const primary = choosePrimaryAttachment([
      {
        filename: "document.pdf",
        mimeType: "application/octet-stream",
        fileSize: 100_000,
        originalOrder: 0,
      },
      {
        filename: "document",
        mimeType: "application/pdf",
        fileSize: 100_000,
        originalOrder: 1,
      },
    ]);

    assert.equal(primary?.originalOrder, 1);
  });

  it("boosts generic expense document terms", () => {
    const primary = choosePrimaryAttachment([
      {
        filename: "terms.pdf",
        mimeType: "application/pdf",
        fileSize: 400_000,
        originalOrder: 0,
      },
      {
        filename: "fatura-2026-01.pdf",
        mimeType: "application/pdf",
        fileSize: 120_000,
        originalOrder: 1,
      },
    ]);

    assert.equal(primary?.filename, "fatura-2026-01.pdf");
  });

  it("penalizes known noise filenames", () => {
    const primary = choosePrimaryAttachment([
      {
        filename: "welcome-terms.pdf",
        mimeType: "application/pdf",
        fileSize: 900_000,
        originalOrder: 0,
      },
      {
        filename: "recibo.pdf",
        mimeType: "application/pdf",
        fileSize: 100_000,
        originalOrder: 1,
      },
    ]);

    assert.equal(primary?.filename, "recibo.pdf");
  });

  it("prefers larger reasonable PDFs after name and MIME scoring", () => {
    const primary = choosePrimaryAttachment([
      {
        filename: "attachment-a.pdf",
        mimeType: "application/pdf",
        fileSize: 120_000,
        originalOrder: 0,
      },
      {
        filename: "attachment-b.pdf",
        mimeType: "application/pdf",
        fileSize: 1_200_000,
        originalOrder: 1,
      },
    ]);

    assert.equal(primary?.filename, "attachment-b.pdf");
  });

  it("caps the size bonus so huge noise PDFs do not dominate", () => {
    const primary = choosePrimaryAttachment([
      {
        filename: "marketing.pdf",
        mimeType: "application/pdf",
        fileSize: 100_000_000,
        originalOrder: 0,
      },
      {
        filename: "invoice.pdf",
        mimeType: "application/pdf",
        fileSize: 400_000,
        originalOrder: 1,
      },
    ]);

    assert.equal(primary?.filename, "invoice.pdf");
  });

  it("uses original order as the final tie-break", () => {
    const primary = choosePrimaryAttachment([
      {
        filename: "a.pdf",
        mimeType: "application/pdf",
        fileSize: 100_000,
        originalOrder: 2,
      },
      {
        filename: "b.pdf",
        mimeType: "application/pdf",
        fileSize: 100_000,
        originalOrder: 1,
      },
    ]);

    assert.equal(primary?.filename, "b.pdf");
  });

  it("returns null when there are no acceptable PDFs", () => {
    const primary = choosePrimaryAttachment([
      {
        filename: "photo.jpg",
        mimeType: "image/jpeg",
        fileSize: 100_000,
        originalOrder: 0,
      },
    ]);

    assert.equal(primary, null);
  });

  it("normalizes accents before matching filename terms", () => {
    const score = scoreAttachmentCandidate({
      filename: "condições-e-factura.pdf",
      mimeType: "application/pdf",
      fileSize: 100_000,
      originalOrder: 0,
    });

    assert.equal(score.isAcceptedPdf, true);
    assert.equal(score.score, 16);
  });
});
