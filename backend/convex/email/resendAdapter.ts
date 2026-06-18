import type { EmailSender, SendEmailParams } from "./types";

const RESEND_SEND_EMAIL_URL = "https://api.resend.com/emails";
const MAILTOBILLS_EXPORTS_ADDRESS = "exports@mailtobills.com";

type ResendErrorResponse = {
  name?: string;
  message?: string;
};

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function cleanFriendlyName(value: string) {
  return value.replace(/["<>\\\r\n]/g, "").trim() || "Customer";
}

async function readResendError(response: Response) {
  try {
    const body = (await response.json()) as ResendErrorResponse;
    return body.message ?? body.name ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

export class ResendAdapter implements EmailSender {
  async send(params: SendEmailParams) {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set");
    }

    const attachments = params.attachment
      ? [
          {
            filename: params.attachment.filename,
            content: bytesToBase64(params.attachment.content),
            content_type: params.attachment.contentType,
          },
        ]
      : undefined;

    const response = await fetch(RESEND_SEND_EMAIL_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: `${cleanFriendlyName(
          params.fromName,
        )} via MailToBills <${MAILTOBILLS_EXPORTS_ADDRESS}>`,
        to: params.to,
        cc: params.cc,
        subject: params.subject,
        html: params.bodyHtml,
        attachments,
      }),
    });

    if (!response.ok) {
      const detail = await readResendError(response);
      throw new Error(`RESEND_SEND_FAILED: ${response.status} ${detail}`);
    }
  }
}
