# MailToBills

MailToBills organizes business expense evidence received by a customer so it can be handed to their accountant without searching through email.

## Language

**Expense Document**:
A PDF received from a supplier that evidences a business expense, such as a supplier invoice, receipt, bill, or `fatura`. MailToBills organizes Expense Documents; it does not manage invoices issued to customers.
_Avoid_: Invoice as the overall product concept, outgoing invoice, sales invoice

**Customer**:
A single signed-in person who collects and exports their own Expense Documents. A Customer is not a shared company workspace and does not have collaborating members in the MVP.
_Avoid_: Workspace, organisation, team, account when implying shared access

**Forwarding Address**:
An email address from which a Customer may forward Expense Documents for collection. A Customer may have multiple Forwarding Addresses; a Forwarding Address does not grant dashboard access.
_Avoid_: Collaborator email, member email

**Primary Forwarding Address**:
The Customer's signed-in email address used as the trusted sender for forwarded Expense Documents in the MVP.
_Avoid_: Any sender, unverified sender

**Additional Forwarding Address**:
A Forwarding Address beyond the Customer's Primary Forwarding Address. Additional Forwarding Addresses are outside the free MVP and require verification before they can be trusted.
_Avoid_: Unverified alias, collaborator email

**Collection Address**:
The MailToBills email address where a Customer sends Expense Documents for collection. A Collection Address is the destination at MailToBills, while a Forwarding Address is the sender address that identifies the Customer.
_Avoid_: Forwarding email when referring to the destination, user email

**Accountant Export**:
A package containing each Collected Expense Document's current Primary Attachment PDF and a metadata Manifest for a Collection Month. Customers on the Free Plan can download an Accountant Export ZIP manually. Customers on the Pro Plan can also send an Accountant Export directly to the Accountant Address, either manually or automatically through an Export Schedule. Accountants do not sign in to MailToBills in the MVP.
_Avoid_: Accountant access, accountant workspace, accountant mode

**Export Schedule**:
A Customer-configured rule that automatically sends an Accountant Export to the Accountant Address on a fixed day each month. The Export Schedule covers the previous Collection Month. If a Collection Month has no Collected Expense Documents, no Accountant Export is sent and the Customer is notified instead. The Customer is CC'd on every Accountant Export sent by an Export Schedule.
_Avoid_: Auto-export, scheduled export, automatic invoice delivery

**Accountant Address**:
The email address of the Customer's accountant, stored as a Customer property and used as the recipient of Accountant Exports sent directly on the Pro Plan. A Customer has at most one Accountant Address. The Accountant Address is not required for Free Plan ZIP download.
_Avoid_: Accountant email, recipient email, accountant account

**Accountant Name**:
An optional display name for the accountant stored alongside the Accountant Address, used in the greeting of outbound Accountant Export emails. Not a login credential or a MailToBills user.
_Avoid_: Accountant account, accountant contact

**Manifest**:
A CSV index included in an Accountant Export with metadata MailToBills already knows, such as primary filename, sender, email subject, received timestamp, and file reference. A Manifest is not an accounting ledger and does not contain extracted supplier amounts, VAT, due dates, or invoice numbers in the MVP.
_Avoid_: Ledger, accounting report, extracted invoice data

**Collected Expense Document**:
A forwarded Expense Document accepted into the Customer's collection and available for viewing or export. A Collected Expense Document is represented as one dashboard row and may contain an Attachment Set with multiple acceptable PDF attachments.
_Avoid_: Unreviewed, reviewed, paid, pending processing

**Deleted Expense Document**:
A formerly Collected Expense Document removed by the Customer from the dashboard and future Accountant Exports. The MVP does not provide restore, bulk delete, or an audit trail for deletion.
_Avoid_: Archived document, hidden document, soft-deleted review item

**Retention**:
Collected Expense Documents remain available to the Customer without an automatic expiry period in the MVP. MailToBills does not promise tax-compliance archiving or automatic cleanup.
_Avoid_: Permanent archive, legal retention, automatic retention policy

**Collection Month**:
The calendar month in which MailToBills receives the forwarded email that produced a Collected Expense Document. Dashboard browsing and Accountant Exports are grouped by Collection Month, not supplier issue date or tax period.
_Avoid_: Invoice month, issue month, accounting period, tax period

**Primary Attachment**:
The PDF in an Attachment Set used as the default document to open and include in an Accountant Export. MailToBills suggests a Primary Attachment automatically, and the Customer may change it manually.
_Avoid_: Only attachment, vendor-specific attachment

**Attachment Set**:
The acceptable PDF attachments collected from one accepted forwarded email. Non-PDF attachments are outside the MVP and are not part of the Attachment Set.
_Avoid_: All email attachments, inline images, email signature files

**Rejected Forwarded Email**:
A forwarded email that does not produce a Collected Expense Document because it cannot be matched to a Customer, has no acceptable PDF attachment, or fails during collection. Rejected Forwarded Emails are not shown in the Customer dashboard in the MVP.
_Avoid_: Customer review item, failed invoice, pending processing

**Plan**:
The tier that determines which features a Customer can access. There are two Plans: Free and Pro. A Customer is always on exactly one Plan.
_Avoid_: Tier, level, account type, membership

**Free Plan**:
The default Plan for all Customers. Includes unlimited Expense Document collection, dashboard browsing, and manual Accountant Export ZIP download. The Free Plan has no expiry and is not a trial.
_Avoid_: Trial, starter, basic, limited

**Pro Plan**:
The paid Plan. Includes everything in the Free Plan plus direct Accountant Export sending, Export Schedule, and Additional Forwarding Addresses. Future premium features are added to the Pro Plan, not the Free Plan.
_Avoid_: Premium, paid tier, upgrade

**Subscription**:
A Customer's active billing relationship with MailToBills. Records the Customer's current Plan, billing status, and period end date. The Subscription is the source of truth for whether a Customer is on the Pro Plan. A Customer on the Free Plan has no Subscription.
_Avoid_: Account, licence, seat

**Lapsed Subscription**:
A Subscription that has ended due to cancellation or payment failure. A Customer with a Lapsed Subscription reverts to the Free Plan. Pro features (Export Schedule, Additional Forwarding Addresses) are paused but their configuration is preserved. All Collected Expense Documents remain accessible and exportable regardless of Subscription state.
_Avoid_: Expired account, banned, downgraded, deleted

## Flagged Ambiguities

**Invoice**:
Existing code and copy use `Invoice` for stored documents. In the domain language, use **Expense Document** unless referring specifically to a supplier invoice subtype.

**Status**:
Existing dashboard copy presents documents as unreviewed or paid. Those are not MVP domain states; accepted Expense Documents are simply **Collected Expense Documents**.

**Month**:
Existing routes use a generic month parameter. In product language this means **Collection Month**.

**Attachment selection**:
The exported n8n workflow contains attachment scoring, but the domain rule is **Primary Attachment** suggestion and belongs to the product, not to a single workflow script.

**NeedsReview**:
The exported n8n workflow uses a `NeedsReview` mailbox folder. That is an operational handling detail for Rejected Forwarded Emails, not a Customer-facing domain state.

**Email address**:
Use **Collection Address** for the MailToBills destination and **Forwarding Address** for the Customer-owned sender. Do not use generic "forwarding email" without specifying which side of the email flow it means.

**Forwarding setup**:
In the MVP, the Customer's Primary Forwarding Address is the only self-service trusted sender. Additional Forwarding Addresses are not accepted without verification.

## Example Dialogue

**Customer**: I forwarded a supplier invoice and a receipt from my business card.

**Support**: Both are Expense Documents, so they will appear together for accountant export.

**Customer**: Can my work email and personal email both forward files into my account?

**Support**: In the MVP, forward from your Primary Forwarding Address. Additional Forwarding Addresses can be added later after verification.

**Customer**: Where do I send my PDFs?

**Support**: Send them to the Collection Address shown in your dashboard.

**Customer**: Can I send an invoice I issued to my client?

**Support**: No. MailToBills currently collects received Expense Documents only.

**Customer**: Can my accountant sign in to download my documents?

**Support**: Not in the MVP. You produce an Accountant Export to send to them.

**Customer**: Does the export include amounts and VAT totals?

**Support**: No. The Accountant Export includes PDFs and a Manifest of known email/file metadata, not extracted accounting facts.

**Customer**: Will all PDFs from a forwarded email go to my accountant?

**Support**: No. The Accountant Export includes the current Primary Attachment. You can change the Primary Attachment before exporting.

**Customer**: How long do you keep my collected documents?

**Support**: They remain available without automatic expiry, but MailToBills is not promising legal or tax-compliance archiving in the MVP.

**Customer**: Do I need to mark each receipt as reviewed or paid?

**Support**: No. Once it is accepted, it is a Collected Expense Document ready to view or export.

**Customer**: I forwarded the wrong file. Can I remove it?

**Support**: Yes. Delete the Collected Expense Document so it no longer appears in your dashboard or Accountant Exports.

**Customer**: I received a December invoice but forwarded it in January. Where will it appear?

**Support**: It appears in January because MailToBills groups by Collection Month.

**Customer**: My forwarded email had a receipt PDF and a terms PDF. What gets saved?

**Support**: MailToBills saves the acceptable PDF attachments as an Attachment Set and suggests the receipt PDF as the Primary Attachment. You can change the Primary Attachment if needed.

**Customer**: Why do I only see one row if my email had three PDFs?

**Support**: The row represents one Collected Expense Document from the forwarded email. Open it to see the Attachment Set and choose the Primary Attachment.

**Customer**: I forwarded an email without a PDF. Why is it not in my dashboard?

**Support**: It became a Rejected Forwarded Email because MailToBills only collects emails with an acceptable Primary Attachment.
