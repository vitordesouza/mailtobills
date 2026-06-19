export type AccountantExportContentDocument = {
  id: string;
  primaryAttachment?: {
    originalFilename: string;
  } | null;
};

export type AccountantExportSkippedDocumentReason =
  | "missing_primary_attachment"
  | "unreadable_primary_attachment";

export type AccountantExportSkippedDocument = {
  id: string;
  reason: AccountantExportSkippedDocumentReason;
};

export type AccountantExportContentSummary = {
  includedDocumentCount: number;
  pdfFileCount: number;
  manifestFileCount: 1;
  fileCount: number;
  skippedDocumentCount: number;
  skippedDocuments: AccountantExportSkippedDocument[];
};

export function summarizeAccountantExportContents(
  documents: readonly AccountantExportContentDocument[],
): AccountantExportContentSummary {
  const skippedDocuments: AccountantExportSkippedDocument[] = [];
  let includedDocumentCount = 0;

  for (const document of documents) {
    if (document.primaryAttachment) {
      includedDocumentCount += 1;
      continue;
    }

    skippedDocuments.push({
      id: document.id,
      reason: "missing_primary_attachment",
    });
  }

  return {
    includedDocumentCount,
    pdfFileCount: includedDocumentCount,
    manifestFileCount: 1,
    fileCount: includedDocumentCount + 1,
    skippedDocumentCount: skippedDocuments.length,
    skippedDocuments,
  };
}
