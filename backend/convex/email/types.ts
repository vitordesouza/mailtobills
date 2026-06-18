export type EmailAttachment = {
  filename: string;
  content: Uint8Array;
  contentType?: string;
};

export type SendEmailParams = {
  to: string;
  cc?: string;
  fromName: string;
  subject: string;
  bodyHtml: string;
  attachment?: EmailAttachment;
};

export interface EmailSender {
  send(params: SendEmailParams): Promise<void>;
}
