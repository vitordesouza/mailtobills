# MailToBills Operations Runbook

This runbook covers the MVP operational path: mailbox collection through n8n,
Convex ingest, dashboard download, and Accountant Export.

## Services

- Dashboard: `apps/dashboard`
- Convex backend: `backend/convex`
- Email automation: `workflows/n8n/ingest-mailtobills.json`
- Collection Address: `inbox@mailtobills.com`

## Required Env Vars

Convex:

```text
INGEST_SECRET=<shared-secret-used-by-n8n>
SITE_URL=<dashboard-origin>
CONVEX_SITE_URL=<dashboard-origin>
```

Dashboard:

```text
NEXT_PUBLIC_CONVEX_URL=<convex-deployment-url>
NEXT_PUBLIC_CONVEX_HTTP_URL=<convex-http-site-url>
```

n8n:

```text
INGEST_SECRET=<same-value-as-convex>
CONVEX_INGEST_URL=<convex-http-site-url>/ingest
```

Optional local dashboard QA:

```text
NEXT_PUBLIC_DEV_AUTH_EMAIL=<local-dev-email>
NEXT_PUBLIC_DEV_AUTH_PASSWORD=<local-only-password>
```

Do not set local QA credentials in production.

## n8n Restart

1. SSH into the VPS.
2. Check the n8n service status.
3. Restart n8n using the VPS service manager or Docker Compose setup used on
   that host.
4. Confirm the workflow is active.
5. Send one test email with a single PDF and confirm it appears in the current
   Collection Month.

## Mailbox Handling

The n8n workflow should keep transport and operational routing only:

- Poll only unread Inbox messages that have attachments.
- Accepted forwarded emails with at least one acceptable PDF: store the
  document in Convex, then move the source email to `Processed`.
- Convex validation failures, including unknown sender or invalid attachment
  payloads: move the source email to `NeedsReview` and continue the batch.
- Emails with attachments but no acceptable PDFs: move the source email to
  `NeedsReview` and continue the batch.
- Emails without attachments are skipped by the MVP workflow filter. Do not
  create Customer-facing dashboard records for them.

Rejected Forwarded Emails are not Customer-facing MVP records.

## Failure Checks

For a failed ingest:

1. Confirm n8n can read the mailbox and attachments.
2. Confirm `INGEST_SECRET` matches between n8n and Convex.
3. Confirm the request includes `forwarderFrom`, `messageId`, `receivedAt`, and
   attachment metadata or base64 data.
4. Confirm the sender is the Customer's Primary Forwarding Address.
5. Check Convex logs for `UNKNOWN_SENDER`, `NO_ACCEPTABLE_PDFS`,
   `INVALID_RECEIVED_AT`, or storage errors.

## Recovery Smoke Test

After any restart or env change:

1. Forward one email with a single PDF from a known Customer email.
2. Confirm one Collected Expense Document appears.
3. Open the Primary Attachment.
4. Export the Collection Month.
5. Inspect `manifest.csv` and confirm it contains known metadata only.
