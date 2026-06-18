# Convex Cron + Resend for Export Schedule delivery

MailToBills needs to send an Accountant Export automatically on a Customer-configured day each month (the Export Schedule). The system must pick a runtime to trigger the send and an email delivery provider.

## Decision

Use a **Convex scheduled action** (daily cron) to detect due Export Schedules and build Accountant Exports, and **Resend** as the initial transactional email provider. Email delivery is isolated behind an `EmailSender` interface so the provider can be swapped without touching business logic.

## Why not n8n

n8n owns the ingest path (receiving forwarded emails from external mailboxes we do not control). The Export Schedule is internal product logic: it owns the ZIP-building, Manifest generation, and the send decision. Putting that in n8n would split product logic across a workflow tool and the codebase, making it impossible to test, version, or reason about in isolation. The existing n8n export attempt also duplicates the ZIP logic that already lives in the Next.js API route — the right fix is to move that logic into a Convex action, not to replicate it again in n8n.

## Why not Vercel Cron calling the Next.js export route

The Next.js `/api/exports/[month]` route currently fetches its own stored files back over HTTP (it calls its own `/api/files/:id` endpoint). That works for a browser download but is fragile for a background job. Moving the ZIP assembly into a Convex action gives it direct storage access, removes the self-referential HTTP call, and makes the same logic available to both the manual export route and the Export Schedule.

## EmailSender abstraction

The Convex action calls an `EmailSender` interface with a single `send(params)` method. The only adapter shipped initially is Resend. A future adapter can point at a self-hosted SMTP server or a different provider by implementing the same interface and changing one environment variable. No business logic changes required to switch.

## Trade-offs accepted

- Convex action payload size limits apply to the ZIP. Very large months (many high-resolution PDFs) may exceed limits — acceptable for the current customer volume; revisit when needed.
- Resend has a free tier sufficient for early growth; cost is per-email, not per-attachment-byte, so it scales predictably.
- A daily Convex cron that loops all Customers is simple but does not scale to thousands of Customers without batching. Acceptable now; add batching when needed.
