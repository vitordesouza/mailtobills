import { httpRouter } from "convex/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { isCollectionMonth } from "@mailtobills/domain";

import { auth } from "./auth";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { buildAccountantExportZip } from "./lib/accountantExport";
import {
  buildBinaryIngestDedupeMaterial,
  buildJsonIngestDedupeMaterial,
  decodeBase64Payload,
  normalizeBinaryIngestPayload,
  normalizeJsonIngestPayload,
  shortDedupeKey,
} from "./lib/ingestNormalization";
import { lemonSqueezyWebhook } from "./subscriptions";

import type { Id } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";
import type { IngestAttachmentInput } from "./lib/ingestNormalization";

function jsonError(
  status: number,
  code: string,
  message: string,
  context: Record<string, unknown> = {}
) {
  return new Response(
    JSON.stringify({ ok: false, code, message, ...context }),
    { status, headers: { "content-type": "application/json" } }
  );
}

async function getUserByForwardingEmail(ctx: ActionCtx, fromEmail: string) {
  const user = await ctx.runQuery(internal.users.getUserByForwardingEmail, {
    fromEmail,
  });

  if (!user) {
    return null;
  }

  return user;
}

async function storeBase64Attachments(
  ctx: ActionCtx,
  attachments: readonly IngestAttachmentInput[]
): Promise<IngestAttachmentInput[]> {
  const stored: IngestAttachmentInput[] = [];

  for (const attachment of attachments) {
    if (
      !attachment.base64Data ||
      attachment.fileStorageId ||
      attachment.fileUrl
    ) {
      stored.push(attachment);
      continue;
    }

    let bytes: Uint8Array;

    try {
      bytes = decodeBase64Payload(attachment.base64Data);
    } catch {
      throw new Error(`Invalid base64 attachment: ${attachment.originalFilename}`);
    }

    const attachmentBytes = new Uint8Array(bytes.length);
    attachmentBytes.set(bytes);

    const fileBlob = new Blob([attachmentBytes], {
      type: attachment.mimeType ?? "application/pdf",
    });
    const fileStorageId = await ctx.storage.store(fileBlob);

    stored.push({
      originalFilename: attachment.originalFilename,
      mimeType: attachment.mimeType,
      fileSize: attachment.fileSize ?? bytes.byteLength,
      fileUrl: attachment.fileUrl,
      fileStorageId,
      attachmentId: attachment.attachmentId,
      originalOrder: attachment.originalOrder,
    });
  }

  return stored;
}

const ingestExpenseDocument = httpAction(async (ctx, request) => {
  const authHeader = request.headers.get("authorization") ?? "";
  const ingestSecret = process.env.INGEST_SECRET;

  if (!ingestSecret) {
    return jsonError(
      500,
      "INGEST_SECRET_NOT_CONFIGURED",
      "Ingest secret is not configured"
    );
  }

  if (authHeader !== `Bearer ${ingestSecret}`) {
    return jsonError(401, "UNAUTHORIZED", "Unauthorized");
  }

  const contentType = request.headers.get("content-type") ?? "";

  // 1) Caminho JSON – aceita payload do n8n
  if (contentType.includes("application/json")) {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonError(400, "INVALID_JSON", "Invalid JSON");
    }

    const normalized = normalizeJsonIngestPayload(body);
    if (!normalized.ok) {
      const { error } = normalized;
      return jsonError(error.status, error.code, error.message, error.context);
    }

    const payload = normalized.payload;
    const user = await getUserByForwardingEmail(ctx, payload.forwarderFrom);

    if (!user) {
      return jsonError(400, "UNKNOWN_SENDER", "Unknown sender", {
        messageId: payload.messageId,
        forwarderFrom: payload.forwarderFrom,
      });
    }

    let attachments: IngestAttachmentInput[];

    try {
      attachments = await storeBase64Attachments(
        ctx,
        payload.attachments,
      );
    } catch (error) {
      return jsonError(400, "INVALID_ATTACHMENT_DATA", "Invalid attachment data", {
        messageId: payload.messageId,
        detail: error instanceof Error ? error.message : undefined,
      });
    }

    const finalDedupeKey = await shortDedupeKey(
      buildJsonIngestDedupeMaterial({
        userId: user._id,
        messageId: payload.messageId,
        receivedAt: payload.receivedAt,
        attachments,
        providedDedupeKey: payload.dedupeKey,
      }),
    );

    try {
      await ctx.runMutation(
        internal.expenseDocuments.ingestCreateExpenseDocument,
        {
          userId: user._id,
          fromEmail: payload.forwarderFrom,
          subject: payload.subject,
          receivedAt: payload.receivedAt,
          messageId: payload.messageId,
          dedupeKey: finalDedupeKey,
          originFromEmail: payload.originFromEmail,
          originFromName: payload.originFromName,
          originDomain: payload.originDomain,
          originSubject: payload.originSubject,
          originSentAt: payload.originSentAt,
          rawEmailMetadata: payload.rawEmailMetadata,
          attachments,
        }
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("NO_ACCEPTABLE_PDFS")
      ) {
        return jsonError(
          400,
          "NO_ACCEPTABLE_PDFS",
          "No acceptable PDF attachments",
          { messageId: payload.messageId }
        );
      }

      throw error;
    }

    return new Response(JSON.stringify({ ok: true, messageId: payload.messageId }), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
  }

  // 2) Caminho binário – para o n8n com attachment_0 + Convex storage
  const url = new URL(request.url);
  const normalized = normalizeBinaryIngestPayload(url);

  if (!normalized.ok) {
    const { error } = normalized;
    return jsonError(error.status, error.code, error.message, error.context);
  }

  const payload = normalized.payload;
  const user = await getUserByForwardingEmail(ctx, payload.fromEmail);

  if (!user) {
    return jsonError(400, "UNKNOWN_SENDER", "Unknown sender", {
      messageId: payload.messageId,
      fromEmail: payload.fromEmail,
    });
  }

  const dedupeKey = await shortDedupeKey(
    buildBinaryIngestDedupeMaterial({
      userId: user._id,
      messageId: payload.messageId,
      receivedAt: payload.receivedAt,
      attachmentId: payload.attachmentId,
      originalFilename: payload.originalFilename,
      fileSize: payload.fileSize,
    }),
  );

  // Aqui a mágica do Convex storage
  // Precisamos armazenar apenas o corpo do arquivo (um Blob/ArrayBuffer), não o Request inteiro
  const fileBuffer = await request.arrayBuffer();
  const fileBlob = new Blob([fileBuffer]);
  const storageId = await ctx.storage.store(fileBlob);

  try {
    await ctx.runMutation(
      internal.expenseDocuments.ingestCreateExpenseDocument,
      {
        userId: user._id,
        fromEmail: payload.fromEmail,
        subject: payload.subject,
        receivedAt: payload.receivedAt,
        messageId: payload.messageId,
        dedupeKey,
        originFromEmail: payload.originFromEmail,
        originFromName: payload.originFromName,
        originDomain: payload.originDomain,
        originSubject: payload.originSubject,
        originSentAt: payload.originSentAt,
        attachments: [
          {
            originalFilename: payload.originalFilename,
            mimeType: payload.mimeType,
            fileSize: payload.fileSize,
            fileStorageId: storageId,
            attachmentId: payload.attachmentId,
            originalOrder: 0,
          },
        ],
      }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("NO_ACCEPTABLE_PDFS")
    ) {
      return jsonError(
        400,
        "NO_ACCEPTABLE_PDFS",
        "No acceptable PDF attachments",
        { messageId: payload.messageId }
      );
    }

    throw error;
  }

  return new Response(JSON.stringify({ ok: true, messageId: payload.messageId }), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
});

const downloadFile = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const attachmentIdParam = url.searchParams.get("attachmentId");

  if (!attachmentIdParam) {
    return new Response("Missing attachmentId", { status: 400 });
  }

  try {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const result = await ctx.runQuery(
      internal.expenseDocuments.getOwnedAttachmentForDownload,
      {
        userId,
        attachmentId: attachmentIdParam as Id<"expenseDocumentAttachments">,
      }
    );

    if (!result) {
      return new Response("File not found", { status: 404 });
    }

    const { attachment } = result;

    if (attachment.fileUrl) {
      return Response.redirect(attachment.fileUrl, 302);
    }

    if (!attachment.fileStorageId) {
      return new Response("File not found", { status: 404 });
    }

    const file = await ctx.storage.get(attachment.fileStorageId);

    if (!file) {
      return new Response("File not found", { status: 404 });
    }

    const filename = attachment.originalFilename.replace(/["\\\r\n]/g, "_");

    return new Response(file, {
      status: 200,
      headers: {
        "content-type": attachment.mimeType ?? "application/pdf",
        "cache-control": "private, max-age=0, must-revalidate",
        "content-disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error fetching file from storage", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});

const downloadAccountantExport = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const month = url.searchParams.get("month");

  if (!month || !isCollectionMonth(month)) {
    return new Response("Invalid Collection Month", { status: 400 });
  }

  try {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const exportZip = await buildAccountantExportZip(ctx, {
      userId,
      month,
    });

    return new Response(exportZip.zipBytes, {
      status: 200,
      headers: {
        "content-type": "application/zip",
        "cache-control": "private, max-age=0, must-revalidate",
        "content-disposition": `attachment; filename="${exportZip.filename}"`,
      },
    });
  } catch (error) {
    console.error("Error building accountant export", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/ingest",
  method: "POST",
  handler: ingestExpenseDocument,
});

http.route({
  path: "/file",
  method: "GET",
  handler: downloadFile,
});

http.route({
  path: "/export",
  method: "GET",
  handler: downloadAccountantExport,
});

http.route({
  path: "/webhooks/lemonsqueezy",
  method: "POST",
  handler: lemonSqueezyWebhook,
});

export default http;
