import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { summarizeAccountantExportContents } from "./accountantExportContents.js";

describe("accountant export contents", () => {
  it("counts Primary Attachment PDFs, the Manifest, and skipped documents", () => {
    const summary = summarizeAccountantExportContents([
      {
        id: "doc-with-primary",
        primaryAttachment: {
          originalFilename: "invoice.pdf",
        },
      },
      {
        id: "doc-without-primary",
        primaryAttachment: null,
      },
    ]);

    assert.deepEqual(summary, {
      includedDocumentCount: 1,
      pdfFileCount: 1,
      manifestFileCount: 1,
      fileCount: 2,
      skippedDocumentCount: 1,
      skippedDocuments: [
        {
          id: "doc-without-primary",
          reason: "missing_primary_attachment",
        },
      ],
    });
  });
});
