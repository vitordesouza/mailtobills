# LemonSqueezy as billing provider

MailToBills needs a payment processor to handle Pro Plan subscriptions, recurring billing, and payment failure recovery.

## Decision

Use **LemonSqueezy** as the billing provider, not Stripe.

## Why not Stripe

Stripe is the default choice for SaaS, but it requires the seller to handle VAT compliance independently. MailToBills targets Portugal and the broader EU market. Under EU rules, a SaaS selling to EU consumers must collect and remit VAT in each buyer's country of residence — either by registering for VAT OSS or per-country. For a small team this is a meaningful ongoing operational burden and compliance risk.

## Why LemonSqueezy

LemonSqueezy acts as Merchant of Record: they are legally the seller of record, collect VAT on MailToBills' behalf, and handle remittance to each EU tax authority. MailToBills receives the net amount and has no VAT registration or filing obligation in any EU country.

The trade-offs accepted:
- LemonSqueezy has a smaller ecosystem than Stripe (fewer integrations, less community content). Acceptable for a two-tier subscription product with a simple webhook surface.
- LemonSqueezy fees are slightly higher than Stripe's base rate. Accepted in exchange for eliminating VAT compliance overhead entirely.
- Migrating away from LemonSqueezy later would require re-subscribing all active Customers through the new provider — a high switching cost. This makes the decision hard to reverse, which is why it is recorded here.

## Subscription data model

LemonSqueezy fires webhooks on subscription lifecycle events (created, renewed, payment failed, cancelled). MailToBills maintains:

- A `subscriptions` Convex table as the source of truth: `userId`, `lemonSqueezySubscriptionId`, `status` (active / past_due / cancelled), `currentPeriodEnd`.
- A derived `isPro` boolean on the `users` table as a fast-path read cache, updated atomically by the same webhook handler that writes to `subscriptions`.

Feature gate checks use `user.isPro` for speed. The `subscriptions` table is the authoritative record for audit, support, and repair.
