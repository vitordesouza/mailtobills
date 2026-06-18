import { ResendAdapter } from "./resendAdapter";

import type { EmailSender } from "./types";

export function getEmailSender(): EmailSender {
  const provider = process.env.EMAIL_PROVIDER ?? "resend";

  if (provider !== "resend") {
    throw new Error(`Unsupported EMAIL_PROVIDER: ${provider}`);
  }

  return new ResendAdapter();
}

export type {
  EmailAttachment,
  EmailSender,
  SendEmailParams,
} from "./types";
