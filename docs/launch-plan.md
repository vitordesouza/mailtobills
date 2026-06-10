# MailToBills Launch Plan

Goal: turn the MVP into a product someone pays for, and get the **first paying
customer** within ~4 weeks. This plan covers value proposition, target market,
UX priorities, pricing, and a week-by-week launch sequence.

---

## 1. Value Proposition

**One-liner:**

> Forward your expense emails as they arrive. At month end, send your
> accountant one clean ZIP — instead of digging through your inbox.

**The job to be done** is not "store invoices." It is the **monthly close
ritual**: every month (or quarter), the accountant asks the customer for their
supplier invoices and receipts, and the customer spends 30–90 painful minutes
searching email, downloading attachments, renaming files, and emailing or
WeTransfer-ing a messy pile.

MailToBills replaces that ritual with two habits:

1. **In the moment:** forward the email to your Collection Address (2 seconds).
2. **At month end:** click "Export month" and send the ZIP + manifest CSV to
   your accountant (30 seconds).

**What we deliberately do NOT promise** (and this is a strength, not a
weakness): no OCR, no VAT extraction, no "AI bookkeeping." Tools that promise
that (Dext, Hubdoc, AutoEntry) cost €20–50/month, require accountant-side
adoption, and still get data wrong. MailToBills is the **dumb, reliable,
cheap** option: your PDFs, organized by month, handed over cleanly. The
accountant does the accounting — we just kill the searching.

**Positioning sentence:**

> For freelancers and micro-businesses who hand documents to an external
> accountant, MailToBills is the simplest way to collect supplier invoices
> from email — unlike OCR-heavy pre-accounting tools, it requires zero
> setup, zero data entry, and zero behavior change from the accountant.

---

## 2. Target Customer & Market Fit

### Beachhead ICP (be narrow on purpose)

**Portuguese freelancer or unipessoal Lda owner who:**

- works with an external accountant (contabilista) — i.e., has *organized
  accounting*, not just recibos verdes with simplified regime
- receives a meaningful share of expense documents **by email as PDFs** —
  especially foreign/SaaS suppliers (Google, OpenAI, Adobe, AWS, Figma…)
  that do **not** appear in e-Fatura
- currently does the "month-end inbox dig" themselves

This profile matters because of the **e-Fatura objection**: Portuguese
suppliers with a NIF already report faturas to e-Fatura. The unbeatable wedge
is **foreign supplier invoices** (every dev/designer/agency has 5–20 SaaS
subscriptions) plus the fact that accountants still want the **actual PDFs**,
not just e-Fatura line items. Lead with that in copy.

The product is English-language and the mechanism is universal, so non-PT
freelancers work too — but for the *first* customers, hunt where the founder
has network and domain knowledge: Portugal.

### The accountant is the channel, not the user

One accountant serves 50–300 clients and personally suffers from chasing
documents every month. The MVP correctly keeps accountants out of the product
(they just receive a ZIP), which means **zero adoption friction on their
side** — but they are the highest-leverage referrer:

> "Tell your clients to use this; you'll get a clean ZIP + CSV index every
> month instead of 40 loose emails."

### Competitive frame

| Alternative | Why people use it | Why we win the wedge |
| --- | --- | --- |
| Email folders + manual download (status quo) | Free, familiar | We remove the painful part (month-end dig), keep the familiar part (forwarding email) |
| Dext / Hubdoc / AutoEntry | OCR, accountant integrations | €20–50/mo, accountant must adopt it, overkill for ≤30 docs/month |
| e-Fatura (PT) | Automatic for PT suppliers | No PDFs, no foreign suppliers, accountants still want files |
| Drive/Dropbox folder | Free | Requires discipline (download → rename → upload); forwarding an email is 10x easier, especially on mobile |

---

## 3. Pricing

Keep it embarrassingly simple. One plan:

- **€9/month or €90/year** — unlimited documents, monthly exports.
- **Free trial: first full Collection Month free** (trial maps to the natural
  usage cycle — they must experience one month-end export to feel the value).

Rationale:

- €9 is under the "don't think about it" threshold for someone already paying
  an accountant €100–250/month, and clearly cheaper than Dext-class tools.
- Do **not** build metered/tiered pricing for the MVP. The first 20 customers
  should all be on one plan so feedback is comparable.
- **Do not build Stripe integration before the first customer.** Use a
  **Stripe Payment Link** (subscription mode) sent manually after trial, and
  flip a `plan` flag on the user record by hand. Wire up real billing
  (Stripe Checkout + webhook → Convex) only after ~5 paying customers prove
  it's worth automating.

---

## 4. High-Level UX

### The activation moment

The single moment that creates a believer:

> "I forwarded an email from my phone and it just… appeared, filed under the
> right month."

Everything in onboarding must drive to that moment in **under 5 minutes**:
sign in → see Collection Address with copy button → forward a real email →
watch the row appear. The current empty state (collection address + 3 steps +
demo document) already serves this well. Two sharpening moves:

1. After the demo document, show a nudge: *"Now try it for real — forward any
   supplier invoice from your inbox."* The demo proves the UI; only a real
   forward proves the magic.
2. Consider a "first document collected" moment of delight (email or
   in-dashboard confirmation). Cheap, and it confirms the loop worked.

### The retention moment

The second believer-moment is the **first month-end export**: ZIP + manifest
sent to the accountant, accountant says "great, keep doing this." A customer
who exports month 2 is a customer who will pay. The export flow is built;
make sure the manifest CSV opens cleanly in Excel (delimiter/encoding for PT
locales) because the *accountant's* first impression rides on it.

### Pre-launch UX cleanup (small, high-trust-impact)

- **Remove or hide non-functional menu items** (Upgrade to Pro, Billing,
  Notifications, Account, Settings stub). Dead buttons in a product holding
  financial documents destroy trust faster than missing features.
- **Legal pages**: Terms and Privacy currently link to `#`. For a product
  ingesting financial documents this is a launch blocker — write short,
  honest pages (what we store, where, that we never share it, how to delete
  everything). GDPR-relevant for PT/EU customers.
- **Password reset** is commented out — either enable it or push everyone to
  Google OAuth (recommended: make Google the primary CTA, it also matches
  "forward from your Gmail" mental model).
- Keep the product's honest tone: never promise OCR/extraction in any copy.

### Landing page (one evening of work)

Current page explains mechanics; it needs to sell the *pain*. Structure:

1. **Hero:** "Stop digging through your inbox for invoices." Sub: "Forward
   expense emails as they arrive. Send your accountant one clean ZIP every
   month." CTA: "Start free — your first month is on us."
2. **The pain, named:** the month-end ritual, in one short paragraph the ICP
   recognizes instantly.
3. How it works (existing 3 steps are good).
4. **What's in the export** — show a real ZIP/manifest screenshot; this is
   what skeptical accountants will ask about.
5. **Honesty block:** "No OCR. No AI guessing your VAT. Your documents,
   organized." (differentiator framed as a feature)
6. Pricing (one card), FAQ (e-Fatura question, security/privacy question,
   "can my accountant log in?" question), footer with real legal links.

---

## 5. Launch Sequence

### Week 0 — Production readiness (ship it)

- [ ] Deploy: Convex prod deployment; landing + dashboard to Vercel; n8n on
      the VPS with production Outlook credentials (re-export workflow — the
      committed JSON has dev mailbox/folder IDs baked in).
- [ ] Real Collection Address: `inbox@mailtobills.com` mailbox live, MX
      records, Processed/NeedsReview folders created, `INGEST_SECRET` set on
      both sides.
- [ ] Run the full `docs/launch-validation-checklist.md` against prod.
- [ ] Legal pages + UX cleanup from §4.
- [ ] Error tracking (Sentry free tier) + basic analytics (Plausible or
      PostHog) — you cannot fix activation drop-off you can't see.
- [ ] Create the Stripe Payment Link (€9/mo).

### Week 1 — Concierge beta (5–10 humans you can name)

Do **not** launch publicly yet. Recruit 5–10 people from your own network who
match the ICP — ideally including **your own accountant's clients** (ask the
accountant directly; this also tests the referral channel).

- Onboard each one **live** (call or in person, 15 min). Watch them forward
  their first email. Every hesitation is a product note.
- Tell them the deal upfront: *"Free this month; if it saves you time at
  month end, it's €9/month after."* Pricing stated on day one filters for
  real customers and makes the later ask natural.
- Operational vigilance: watch the NeedsReview folder daily; every rejected
  email in the beta is a chance to fix a heuristic or a doc.

### Weeks 2–3 — The month-end moment

- When the month closes, prompt each beta user to run their Accountant
  Export and actually send it to their accountant.
- **Interview the accountants** (even 10 minutes): is the ZIP/manifest
  format right? Would they recommend this to other clients? This is both
  product validation and channel development.
- Fix the top 3 friction points only. Resist the backlog.

### Week 4 — Convert and open up

- **The ask:** message each active beta user: *"Your free month is up — here's
  the link (€9/mo or €90/yr)."* Anyone who exported a month and sent it to
  their accountant has felt the value; expect 2–4 of 8 to convert. **That is
  your first paying customer** — likely week 4, possibly earlier if someone
  offers (take their money immediately; don't wait for billing automation).
- **Accountant referral motion:** offer the 1–2 friendliest accountants a
  simple deal (e.g., their clients get an extended trial, or a flat thank-you)
  to mention it to document-chasing clients. One accountant = 10–50 warm leads.
- **Public soft launch** (only after first revenue):
  - PT freelancer communities (Facebook groups for recibos verdes /
    trabalhadores independentes, LinkedIn post telling the founding story).
  - Indie/maker channels: X/Twitter build-in-public thread, r/freelance,
    Indie Hackers. Product Hunt is optional and later — it brings tourists,
    not Portuguese freelancers with accountants.
  - One SEO content page targeting "como organizar faturas para o
    contabilista" / "organize invoices for accountant" — low volume, but the
    intent is perfect and competition is weak.

---

## 6. What NOT to do before the first customer

- No OCR/extraction features (explicitly out of MVP scope — keep it that way).
- No team/workspace features, no accountant login.
- No automated Stripe integration, metered plans, or annual-plan machinery.
- No paid ads.
- No second language, no rebrand, no redesign.

Every one of these is a way to avoid the scary part, which is asking ten
specific humans to use it and then asking them for €9.

---

## 7. Metrics that matter (only four)

1. **Activation rate:** signups → first *real* (non-demo) Collected Expense
   Document. Target >60% with concierge onboarding.
2. **Time to first document:** signup → first collected doc. Target <1 day.
3. **Month-2 export:** did they export a second Collection Month? This is
   the retention signal and the paywall trigger.
4. **Trial → paid conversion** on the week-4 ask.

## 8. Top risks & mitigations

| Risk | Mitigation |
| --- | --- |
| "e-Fatura already does this" (PT objection) | Lead with foreign/SaaS supplier invoices + "your accountant wants the PDFs"; put it in the FAQ |
| Ingestion fragility (Outlook polling, n8n on VPS) | During beta, check NeedsReview + n8n daily; a silently-dropped invoice during trial kills trust permanently |
| Trust with financial documents | Real legal pages, no dead UI, honest copy, easy account-deletion promise |
| Habit doesn't stick (users forget to forward) | Concierge follow-up mid-month ("forwarded anything this week?"); later: gentle email nudge |
