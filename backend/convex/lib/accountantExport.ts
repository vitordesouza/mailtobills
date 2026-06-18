import {
  buildManifestCsv,
  buildZip,
  sanitizeZipName,
} from "@mailtobills/types";

import { internal } from "../_generated/api";

import type { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";
import type { ExportManifestRow, ZipFileInput } from "@mailtobills/types";

type BuildAccountantExportZipParams = {
  userId: Id<"users">;
  month: string;
};

async function readAttachmentBytes(
  ctx: Pick<ActionCtx, "storage">,
  attachment: {
    fileStorageId?: Id<"_storage">;
    fileUrl?: string;
  },
) {
  if (attachment.fileStorageId) {
    const file = await ctx.storage.get(attachment.fileStorageId);
    return file ? new Uint8Array(await file.arrayBuffer()) : null;
  }

  if (attachment.fileUrl) {
    const response = await fetch(attachment.fileUrl);
    return response.ok ? new Uint8Array(await response.arrayBuffer()) : null;
  }

  return null;
}

export async function buildAccountantExportZip(
  ctx: Pick<ActionCtx, "runQuery" | "storage">,
  params: BuildAccountantExportZipParams,
) {
  const documents = await ctx.runQuery(
    internal.expenseDocuments.listForAccountantExport,
    params,
  );

  const manifestRows: ExportManifestRow[] = [];
  const files: ZipFileInput[] = [];

  for (const document of documents) {
    const primary = document.primaryAttachment;

    if (!primary) {
      continue;
    }

    const bytes = await readAttachmentBytes(ctx, primary);

    if (!bytes) {
      continue;
    }

    const filename = `${sanitizeZipName(document._id)}-${sanitizeZipName(
      primary.originalFilename,
    )}`;

    files.push({
      name: `pdfs/${filename}`,
      bytes,
    });

    manifestRows.push({
      id: document._id,
      filename: primary.originalFilename,
      sender: document.originFromEmail ?? document.fromEmail,
      subject: document.subject,
      receivedAt: document.receivedAt,
      attachmentCount: document.attachments.length,
    });
  }

  files.push({
    name: "manifest.csv",
    bytes: new TextEncoder().encode(buildManifestCsv(manifestRows)),
  });

  return {
    filename: `mailtobills-${params.month}.zip`,
    zipBytes: buildZip(files),
    documentCount: manifestRows.length,
  };
}
