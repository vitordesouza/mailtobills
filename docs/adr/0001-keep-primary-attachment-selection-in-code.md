# Keep Primary Attachment Selection in Code

MailToBills must suggest one Primary Attachment from accepted forwarded emails that may contain multiple PDF attachments. We keep that suggestion rule in the codebase, covered by tests, because it is core product behaviour; n8n may transport attachment metadata and files, but a workflow code node should not be the only place where this rule is defined, versioned, or verified.
