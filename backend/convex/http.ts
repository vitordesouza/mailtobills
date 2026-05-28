import { httpRouter } from "convex/server";
import { getAuthUserId } from "@convex-dev/auth/server";

import { auth } from "./auth";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

import type { Id } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";

type ParsedForward = {
  originFromEmail?: string;
  originFromName?: string;
  originDomain?: string;
  originSubject?: string;
  originSentAt?: number;
};

type IngestAttachmentInput = {
  originalFilename: string;
  mimeType?: string;
  fileSize?: number;
  fileUrl?: string;
  fileStorageId?: Id<"_storage">;
  attachmentId?: string;
  originalOrder: number;
  base64Data?: string;
};

function parseForwardedBodyPreview(
  bodyPreview: string | undefined
): ParsedForward {
  if (!bodyPreview || typeof bodyPreview !== "string") return {};

  // Common forward header block:
  // From: Name <email>
  // Date: Sun, Dec 14, 2025 at 11:37 AM
  // Subject: ...
  const fromMatch =
    bodyPreview.match(/\bFrom:\s*([^\n<]+)?\s*<([^>\s]+)>/i) ||
    bodyPreview.match(/\bFrom:\s*([^\n]+?)\s*(?:\n|$)/i);

  let originFromName: string | undefined;
  let originFromEmail: string | undefined;

  if (fromMatch) {
    if (fromMatch.length >= 3 && fromMatch[2]) {
      originFromEmail = fromMatch[2].trim();
      originFromName = (fromMatch[1] ?? "").trim() || undefined;
    } else if (fromMatch[1]) {
      // fallback: "From: noreply@domain.com" or "From: Endesa Energia"
      const raw = fromMatch[1].trim();
      if (raw.includes("@")) originFromEmail = raw;
      else originFromName = raw;
    }
  }

  const subjectMatch = bodyPreview.match(/\bSubject:\s*(.+?)(?:\n|$)/i);
  const originSubject = subjectMatch?.[1]?.trim() || undefined;

  const dateMatch = bodyPreview.match(/\bDate:\s*(.+?)(?:\n|$)/i);
  const dateRaw = dateMatch?.[1]?.trim();
  const parsedDate = dateRaw ? new Date(dateRaw) : null;
  const originSentAt =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate.getTime()
      : undefined;

  const originDomain =
    originFromEmail && originFromEmail.includes("@")
      ? originFromEmail.split("@").pop()
      : undefined;

  return {
    originFromEmail,
    originFromName,
    originDomain,
    originSubject,
    originSentAt,
  };
}

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

function toBase64Url(bytes: Uint8Array) {
  // Browser-compatible base64url
  // Browser-compatible base64url encoding for Uint8Array
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    // Ensure byte is defined, fallback to 0 if somehow undefined (shouldn't happen)
    binary += String.fromCharCode(byte ?? 0);
  }
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function shortDedupeKey(raw: string) {
  const data = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest).slice(0, 12); // 96 bits is enough here
  return `d_${toBase64Url(bytes)}`;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function optionalNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function decodeBase64Payload(value: string) {
  const [, payload = value] = value.split(",");
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function parseJsonAttachments(body: Record<string, unknown>) {
  const rawAttachments = Array.isArray(body.attachments)
    ? body.attachments
    : [];

  const attachments = rawAttachments
    .filter(isRecord)
    .map<IngestAttachmentInput | null>((attachment, index) => {
      const originalFilename =
        optionalString(attachment.originalFilename) ??
        optionalString(attachment.fileName) ??
        optionalString(attachment.filename);

      if (!originalFilename) {
        return null;
      }

      return {
        originalFilename,
        mimeType: optionalString(attachment.mimeType),
        fileSize: optionalNumber(attachment.fileSize),
        fileUrl: optionalString(attachment.fileUrl),
        fileStorageId: optionalString(attachment.fileStorageId) as
          | Id<"_storage">
          | undefined,
        base64Data:
          optionalString(attachment.base64Data) ??
          optionalString(attachment.data),
        attachmentId:
          optionalString(attachment.attachmentId) ??
          optionalString(attachment.id) ??
          optionalString(attachment.key),
        originalOrder: optionalNumber(attachment.originalOrder) ?? index,
      };
    })
    .filter((attachment): attachment is IngestAttachmentInput =>
      Boolean(attachment)
    );

  if (attachments.length > 0) {
    return attachments;
  }

  const pdfMeta = isRecord(body.pdfMeta) ? body.pdfMeta : undefined;
  const originalFilename =
    optionalString(pdfMeta?.fileName) ??
    optionalString(pdfMeta?.originalFilename) ??
    "document.pdf";

  return [
    {
      originalFilename,
      mimeType: optionalString(pdfMeta?.mimeType),
      fileSize: optionalNumber(pdfMeta?.fileSize),
      fileUrl: optionalString(pdfMeta?.fileUrl),
      base64Data:
        optionalString(pdfMeta?.base64Data) ?? optionalString(pdfMeta?.data),
      attachmentId:
        optionalString(body.attachmentId) ??
        optionalString(pdfMeta?.attachmentId) ??
        optionalString(pdfMeta?.key) ??
        optionalString(pdfMeta?.fileName),
      originalOrder: 0,
    },
  ];
}

function attachmentSetIdentity(attachments: readonly IngestAttachmentInput[]) {
  return attachments
    .map((attachment) =>
      [
        attachment.originalOrder,
        attachment.attachmentId ?? "",
        attachment.originalFilename,
        attachment.fileSize ?? "",
      ].join(":")
    )
    .join("|");
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

    const bytes = decodeBase64Payload(attachment.base64Data);
    const fileBlob = new Blob([bytes], {
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

const ingestInvoice = httpAction(async (ctx, request) => {
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

    // New validation for n8n payload
    if (!isRecord(body)) {
      return jsonError(400, "INVALID_PAYLOAD", "Invalid payload");
    }

    // n8n payload (current workflow) sends these:
    const forwarderFrom = optionalString(body.forwarderFrom);
    if (!forwarderFrom) {
      return jsonError(400, "MISSING_FORWARDER_FROM", "Missing forwarderFrom", {
        messageId: optionalString(body.messageId),
      });
    }

    const messageId = optionalString(body.messageId);
    if (!messageId) {
      return jsonError(400, "MISSING_MESSAGE_ID", "Missing messageId");
    }

    const receivedAtRaw = body.receivedAt;
    const receivedAtMs =
      typeof receivedAtRaw === "number"
        ? receivedAtRaw
        : typeof receivedAtRaw === "string"
          ? new Date(receivedAtRaw).getTime()
          : NaN;

    if (!Number.isFinite(receivedAtMs)) {
      return jsonError(400, "INVALID_RECEIVED_AT", "Invalid receivedAt", {
        messageId,
      });
    }

    const user = await getUserByForwardingEmail(ctx, forwarderFrom);

    if (!user) {
      return jsonError(400, "UNKNOWN_SENDER", "Unknown sender", {
        messageId,
        forwarderFrom,
      });
    }

    const attachments = await storeBase64Attachments(
      ctx,
      parseJsonAttachments(body)
    );
    const raw = isRecord(body.raw) ? body.raw : undefined;

    // bodyPreview often lives in the raw Outlook payload
    const effectiveBodyPreview =
      optionalString(body.bodyPreview) ??
      (typeof raw?.bodyPreview === "string"
        ? raw.bodyPreview
        : undefined);

    const parsed = parseForwardedBodyPreview(effectiveBodyPreview);

    const dedupeKey = optionalString(body.dedupeKey);
    const rawDedupe =
      dedupeKey ??
      `${user._id}|${messageId}|${receivedAtMs}|${attachmentSetIdentity(attachments)}`;

    const finalDedupeKey = await shortDedupeKey(rawDedupe);

    try {
      await ctx.runMutation(
        internal.expenseDocuments.ingestCreateExpenseDocument,
        {
          userId: user._id,
          fromEmail: forwarderFrom,
          subject: optionalString(body.subject),
          receivedAt: receivedAtMs,
          messageId,
          dedupeKey: finalDedupeKey,
          originFromEmail:
            optionalString(body.originFromEmail) ?? parsed.originFromEmail,
          originFromName:
            optionalString(body.originFromName) ?? parsed.originFromName,
          originDomain: optionalString(body.originDomain) ?? parsed.originDomain,
          originSubject:
            optionalString(body.originSubject) ?? parsed.originSubject,
          originSentAt: optionalNumber(body.originSentAt) ?? parsed.originSentAt,
          rawEmailMetadata: body.raw ?? body,
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
          { messageId }
        );
      }

      throw error;
    }

    return new Response(JSON.stringify({ ok: true, messageId }), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
  }

  // 2) Caminho binário – para o n8n com attachment_0 + Convex storage
  const url = new URL(request.url);

  const fromEmail =
    url.searchParams.get("fromEmail") ??
    url.searchParams.get("forwarderFrom") ??
    undefined;
  const subject = url.searchParams.get("subject") ?? undefined;
  const messageId = url.searchParams.get("messageId") ?? undefined;
  const attachmentId = url.searchParams.get("attachmentId") ?? undefined;
  const mimeType = url.searchParams.get("mimeType") ?? undefined;
  const fileSize = optionalNumber(url.searchParams.get("fileSize"));
  const receivedAtParam = url.searchParams.get("receivedAt");
  const receivedAt = receivedAtParam ? Number(receivedAtParam) : Date.now();
  if (!Number.isFinite(receivedAt)) {
    return jsonError(400, "INVALID_RECEIVED_AT", "Invalid receivedAt", {
      messageId,
    });
  }

  const originalFilename =
    url.searchParams.get("originalFilename") ?? "document.pdf";

  const originFromEmail = url.searchParams.get("originFromEmail") ?? undefined;
  const originFromName = url.searchParams.get("originFromName") ?? undefined;
  const originDomain = url.searchParams.get("originDomain") ?? undefined;
  const originSubject = url.searchParams.get("originSubject") ?? undefined;
  const originSentAtParam = url.searchParams.get("originSentAt");
  const originSentAt = originSentAtParam
    ? Number(originSentAtParam)
    : undefined;

  if (!fromEmail) {
    return jsonError(
      400,
      "MISSING_FORWARDING_EMAIL",
      "Missing forwarding email",
      {
        messageId,
      }
    );
  }

  const user = await getUserByForwardingEmail(ctx, fromEmail);

  if (!user) {
    return jsonError(400, "UNKNOWN_SENDER", "Unknown sender", {
      messageId,
      fromEmail,
    });
  }

  const rawDedupe = `${user._id}|${messageId ?? "no-message"}|${receivedAt}|0:${attachmentId ?? ""}:${originalFilename}:${fileSize ?? ""}`;
  const dedupeKey = await shortDedupeKey(rawDedupe);

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
        fromEmail,
        subject,
        receivedAt,
        messageId,
        dedupeKey,
        originFromEmail,
        originFromName,
        originDomain,
        originSubject,
        originSentAt,
        attachments: [
          {
            originalFilename,
            mimeType,
            fileSize,
            fileStorageId: storageId,
            attachmentId,
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
        { messageId }
      );
    }

    throw error;
  }

  return new Response(JSON.stringify({ ok: true, messageId }), {
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

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/ingest",
  method: "POST",
  handler: ingestInvoice,
});

http.route({
  path: "/file",
  method: "GET",
  handler: downloadFile,
});

export default http;
