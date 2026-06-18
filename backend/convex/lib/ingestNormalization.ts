import { normalizeBase64Payload } from "@mailtobills/types";

import type { Id } from "../_generated/dataModel";

type ParsedForward = {
  originFromEmail?: string;
  originFromName?: string;
  originDomain?: string;
  originSubject?: string;
  originSentAt?: number;
};

export type IngestAttachmentInput = {
  originalFilename: string;
  mimeType?: string;
  fileSize?: number;
  fileUrl?: string;
  fileStorageId?: Id<"_storage">;
  attachmentId?: string;
  originalOrder: number;
  base64Data?: string;
};

export type NormalizedJsonIngestPayload = ParsedForward & {
  forwarderFrom: string;
  messageId: string;
  subject?: string;
  receivedAt: number;
  dedupeKey?: string;
  rawEmailMetadata: unknown;
  attachments: IngestAttachmentInput[];
};

export type NormalizedBinaryIngestPayload = ParsedForward & {
  fromEmail: string;
  messageId?: string;
  subject?: string;
  receivedAt: number;
  originalFilename: string;
  mimeType?: string;
  fileSize?: number;
  attachmentId?: string;
};

type IngestPayloadError = {
  status: number;
  code: string;
  message: string;
  context?: Record<string, unknown>;
};

type IngestPayloadResult<T> =
  | { ok: true; payload: T }
  | { ok: false; error: IngestPayloadError };

const PT_MONTHS: Record<string, string> = {
  janeiro: "January",
  fevereiro: "February",
  março: "March",
  abril: "April",
  maio: "May",
  junho: "June",
  julho: "July",
  agosto: "August",
  setembro: "September",
  outubro: "October",
  novembro: "November",
  dezembro: "December",
};

function parseForwardedDate(raw: string | undefined): number | undefined {
  if (!raw) return undefined;

  let normalized = raw
    .replace(/\s+(?:at|às)\s+/gi, " ")
    .replace(/\bde\s+/gi, "");
  for (const [pt, en] of Object.entries(PT_MONTHS)) {
    normalized = normalized.replace(new RegExp(pt, "i"), en);
  }

  for (const candidate of [raw, normalized]) {
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
  }

  return undefined;
}

function parseForwardedText(text: string): ParsedForward {
  const fromMatch =
    text.match(/\b(?:From|De):\s*([^\n<]+)?\s*<([^>\s]+)>/i) ||
    text.match(/\b(?:From|De):\s*([^\n]+?)\s*(?:\n|$)/i);

  let originFromName: string | undefined;
  let originFromEmail: string | undefined;

  if (fromMatch) {
    if (fromMatch.length >= 3 && fromMatch[2]) {
      originFromEmail = fromMatch[2].trim();
      originFromName = (fromMatch[1] ?? "").trim() || undefined;
    } else if (fromMatch[1]) {
      const raw = fromMatch[1].trim();
      if (raw.includes("@")) originFromEmail = raw;
      else originFromName = raw;
    }
  }

  const subjectMatch = text.match(/\b(?:Subject|Assunto):\s*(.+?)(?:\n|$)/i);
  const originSubject = subjectMatch?.[1]?.trim() || undefined;

  const dateMatch = text.match(
    /\b(?:Date|Data|Enviada?o?):\s*(.+?)(?:\n|$)/i,
  );
  const originSentAt = parseForwardedDate(dateMatch?.[1]?.trim());

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

function htmlToText(html: string): string {
  return html
    .replace(/<(?:style|script)[\s\S]*?<\/(?:style|script)>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|tr|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/[ \t]+/g, " ");
}

function parseForwardedBodyPreview(
  bodyPreview: string | undefined,
  bodyHtml?: string,
): ParsedForward {
  const fromPreview =
    bodyPreview && typeof bodyPreview === "string"
      ? parseForwardedText(bodyPreview)
      : {};

  if (
    bodyHtml &&
    (!fromPreview.originFromEmail || !fromPreview.originSentAt)
  ) {
    const fromBody = parseForwardedText(htmlToText(bodyHtml));
    return {
      originFromEmail: fromPreview.originFromEmail ?? fromBody.originFromEmail,
      originFromName: fromPreview.originFromName ?? fromBody.originFromName,
      originDomain: fromPreview.originDomain ?? fromBody.originDomain,
      originSubject: fromPreview.originSubject ?? fromBody.originSubject,
      originSentAt: fromPreview.originSentAt ?? fromBody.originSentAt,
    };
  }

  return fromPreview;
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

export function decodeBase64Payload(value: string) {
  const binary = atob(normalizeBase64Payload(value));
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
      Boolean(attachment),
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

function attachmentSetIdentity(
  attachments: readonly IngestAttachmentInput[],
) {
  return attachments
    .map((attachment) =>
      [
        attachment.originalOrder,
        attachment.attachmentId ?? "",
        attachment.originalFilename,
        attachment.fileSize ?? "",
      ].join(":"),
    )
    .join("|");
}

export function buildJsonIngestDedupeMaterial({
  userId,
  messageId,
  receivedAt,
  attachments,
  providedDedupeKey,
}: {
  userId: Id<"users">;
  messageId: string;
  receivedAt: number;
  attachments: readonly IngestAttachmentInput[];
  providedDedupeKey?: string;
}) {
  return (
    providedDedupeKey ??
    `${userId}|${messageId}|${receivedAt}|${attachmentSetIdentity(attachments)}`
  );
}

export function buildBinaryIngestDedupeMaterial({
  userId,
  messageId,
  receivedAt,
  attachmentId,
  originalFilename,
  fileSize,
}: {
  userId: Id<"users">;
  messageId?: string;
  receivedAt: number;
  attachmentId?: string;
  originalFilename: string;
  fileSize?: number;
}) {
  return `${userId}|${messageId ?? "no-message"}|${receivedAt}|0:${attachmentId ?? ""}:${originalFilename}:${fileSize ?? ""}`;
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function shortDedupeKey(raw: string) {
  const data = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest).slice(0, 12);
  return `d_${toBase64Url(bytes)}`;
}

export function normalizeJsonIngestPayload(
  body: unknown,
): IngestPayloadResult<NormalizedJsonIngestPayload> {
  if (!isRecord(body)) {
    return {
      ok: false,
      error: {
        status: 400,
        code: "INVALID_PAYLOAD",
        message: "Invalid payload",
      },
    };
  }

  const forwarderFrom = optionalString(body.forwarderFrom);
  if (!forwarderFrom) {
    return {
      ok: false,
      error: {
        status: 400,
        code: "MISSING_FORWARDER_FROM",
        message: "Missing forwarderFrom",
        context: { messageId: optionalString(body.messageId) },
      },
    };
  }

  const messageId = optionalString(body.messageId);
  if (!messageId) {
    return {
      ok: false,
      error: {
        status: 400,
        code: "MISSING_MESSAGE_ID",
        message: "Missing messageId",
      },
    };
  }

  const receivedAtRaw = body.receivedAt;
  const receivedAt =
    typeof receivedAtRaw === "number"
      ? receivedAtRaw
      : typeof receivedAtRaw === "string"
        ? new Date(receivedAtRaw).getTime()
        : NaN;

  if (!Number.isFinite(receivedAt)) {
    return {
      ok: false,
      error: {
        status: 400,
        code: "INVALID_RECEIVED_AT",
        message: "Invalid receivedAt",
        context: { messageId },
      },
    };
  }

  const raw = isRecord(body.raw) ? body.raw : undefined;
  const effectiveBodyPreview =
    optionalString(body.bodyPreview) ??
    (typeof raw?.bodyPreview === "string" ? raw.bodyPreview : undefined);
  const rawBody = isRecord(raw?.body) ? raw.body : undefined;
  const rawBodyContent =
    typeof rawBody?.content === "string" ? rawBody.content : undefined;
  const parsed = parseForwardedBodyPreview(
    effectiveBodyPreview,
    rawBodyContent,
  );

  return {
    ok: true,
    payload: {
      forwarderFrom,
      messageId,
      subject: optionalString(body.subject),
      receivedAt,
      dedupeKey: optionalString(body.dedupeKey),
      originFromEmail:
        optionalString(body.originFromEmail) ?? parsed.originFromEmail,
      originFromName:
        optionalString(body.originFromName) ?? parsed.originFromName,
      originDomain: optionalString(body.originDomain) ?? parsed.originDomain,
      originSubject:
        optionalString(body.originSubject) ?? parsed.originSubject,
      originSentAt: optionalNumber(body.originSentAt) ?? parsed.originSentAt,
      rawEmailMetadata: body.raw ?? body,
      attachments: parseJsonAttachments(body),
    },
  };
}

export function normalizeBinaryIngestPayload(
  url: URL,
  now = Date.now(),
): IngestPayloadResult<NormalizedBinaryIngestPayload> {
  const fromEmail =
    url.searchParams.get("fromEmail") ??
    url.searchParams.get("forwarderFrom") ??
    undefined;
  const messageId = url.searchParams.get("messageId") ?? undefined;
  const receivedAtParam = url.searchParams.get("receivedAt");
  const receivedAt = receivedAtParam ? Number(receivedAtParam) : now;

  if (!Number.isFinite(receivedAt)) {
    return {
      ok: false,
      error: {
        status: 400,
        code: "INVALID_RECEIVED_AT",
        message: "Invalid receivedAt",
        context: { messageId },
      },
    };
  }

  if (!fromEmail) {
    return {
      ok: false,
      error: {
        status: 400,
        code: "MISSING_FORWARDING_EMAIL",
        message: "Missing forwarding email",
        context: { messageId },
      },
    };
  }

  const originSentAtParam = url.searchParams.get("originSentAt");

  return {
    ok: true,
    payload: {
      fromEmail,
      subject: url.searchParams.get("subject") ?? undefined,
      messageId,
      attachmentId: url.searchParams.get("attachmentId") ?? undefined,
      mimeType: url.searchParams.get("mimeType") ?? undefined,
      fileSize: optionalNumber(url.searchParams.get("fileSize")),
      receivedAt,
      originalFilename:
        url.searchParams.get("originalFilename") ?? "document.pdf",
      originFromEmail: url.searchParams.get("originFromEmail") ?? undefined,
      originFromName: url.searchParams.get("originFromName") ?? undefined,
      originDomain: url.searchParams.get("originDomain") ?? undefined,
      originSubject: url.searchParams.get("originSubject") ?? undefined,
      originSentAt: originSentAtParam ? Number(originSentAtParam) : undefined,
    },
  };
}
