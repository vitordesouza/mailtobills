# MailToBills Launch Validation Checklist

Use this checklist for local, VPS, and production smoke tests before launch.
Keep the scope to the MVP: received Expense Documents, Primary Attachments,
monthly dashboard browsing, and Accountant Export.

## Dashboard QA

- [ ] Sign in with the local/dev QA account.
- [ ] Open the current Collection Month.
- [ ] Verify the empty state does not promise OCR, VAT extraction, parsing, or
      accountant access.
- [ ] Add a demo document while email ingestion is still being tested.
- [ ] Verify desktop, tablet, and mobile layouts do not have page-level
      horizontal overflow.
- [ ] Verify the Expense Documents table scrolls inside its own frame on narrow
      screens.
- [ ] Click an Expense Document row and confirm the right-side detail panel opens
      without navigating away from the dashboard.
- [ ] Confirm the detail panel shows the original email subject, sender,
      forwarding address, received date, and original sent date when available.
- [ ] Confirm the embedded PDF preview loads in the detail panel and the user can
      move to the previous and next documents without closing it.
- [ ] Expand an Attachment Set and confirm the Primary Attachment is obvious.
- [ ] Verify `Export month`, `View PDF`, expanded Attachment `Open`,
      `Make primary`, detail-panel `Download PDF`, overflow `Delete`, and `Copy`
      controls remain reachable.

## Email Ingest

- [ ] Forward one email with a single PDF from the Customer's Primary Forwarding
      Address.
- [ ] Forward one email with multiple PDFs and confirm one row appears with an
      Attachment Set.
- [ ] Confirm the suggested Primary Attachment follows the additive scoring
      heuristic.
- [ ] Forward one email without acceptable PDFs and confirm it is rejected.
- [ ] Forward one email from an unknown sender and confirm it is rejected.
- [ ] Replay the same message and confirm the dedupe key prevents duplicate
      Collected Expense Documents.
- [ ] Confirm rejected emails are handled operationally and do not appear in the
      Customer dashboard.

## Detail Panel, Download, And Export

- [ ] Open the Primary Attachment from the row or `View PDF` action and confirm
      the dashboard remains visible behind the detail panel.
- [ ] Open a non-primary attachment from the expanded Attachment Set and confirm
      the same detail panel previews that attachment.
- [ ] Use `Download PDF` in the detail panel and confirm it downloads the
      selected attachment.
- [ ] Use `Open original` in the detail panel and confirm it opens only when the
      user explicitly chooses the browser/native PDF view.
- [ ] Change the Primary Attachment from the table and from the detail panel, then
      confirm the row and export use the new Primary Attachment.
- [ ] Delete a document from the detail panel overflow menu and confirm the
      confirmation dialog appears before deletion.
- [ ] Export a Collection Month with documents and inspect the ZIP contents.
- [ ] Confirm the ZIP contains one PDF per Collected Expense Document.
- [ ] Confirm the Manifest CSV contains only known metadata, not extracted
      accounting facts.
- [ ] Export an empty Collection Month and confirm stable behavior.
- [ ] Confirm file and export URLs require authentication.

## Operations

- [ ] Confirm n8n is deployed on the VPS.
- [ ] Configure the Collection Address mailbox.
- [ ] Set `INGEST_SECRET` in n8n and Convex.
- [ ] Confirm n8n calls the Convex `/ingest` endpoint.
- [ ] Document how to restart n8n and where to find logs.
- [ ] Document mailbox folders used for accepted and rejected messages.
- [ ] Confirm no raw sensitive email data is exposed in dashboard responses.
