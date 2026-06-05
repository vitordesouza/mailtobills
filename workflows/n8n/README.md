# n8n Workflows

`ingest-mailtobills.json` polls the collection mailbox, loads each forwarded
email with attachments, and sends one JSON ingest request per accepted email.

The workflow should only handle transport and operational routing:

- keep acceptable PDF attachments for the email payload
- move no-PDF or failed messages to an operational mailbox folder
- move accepted messages to the processed mailbox folder

Primary Attachment selection belongs in the MailToBills backend/shared TypeScript
logic, not in n8n.

Use `docs/launch-validation-checklist.md` for launch smoke tests and
`docs/operations-runbook.md` for VPS/n8n recovery steps.
