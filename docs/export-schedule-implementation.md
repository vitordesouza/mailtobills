# Export Schedule — Implementation Guide

Decisions captured in [`CONTEXT.md`](../CONTEXT.md) and [`docs/adr/0002-convex-cron-resend-for-export-schedule.md`](adr/0002-convex-cron-resend-for-export-schedule.md).

---

## Slice 1 — Schema + Accountant fields

**Files:** `backend/convex/schema.ts`, `backend/convex/users.ts`

### schema.ts
Add to the `users` defineTable call:
```ts
accountantEmail: v.optional(v.string()),
accountantName:  v.optional(v.string()),
exportScheduleDay: v.optional(v.number()),       // 1–28
exportScheduleLastSentMonth: v.optional(v.string()), // 'YYYY-MM', for idempotency
```

### users.ts
The existing `viewer` query already returns the full user row — no new query needed.

Add mutation `updateExportSchedule`:
```ts
export const updateExportSchedule = mutation({
  args: {
    accountantEmail: v.optional(v.string()),
    accountantName:  v.optional(v.string()),
    exportScheduleDay: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireSignedInUserId(ctx);
    if (args.exportScheduleDay !== undefined) {
      if (args.exportScheduleDay < 1 || args.exportScheduleDay > 28) {
        throw new Error('exportScheduleDay must be between 1 and 28');
      }
    }
    if (args.accountantEmail && !args.accountantEmail.includes('@')) {
      throw new Error('Invalid accountantEmail');
    }
    await ctx.db.patch(userId, {
      accountantEmail: args.accountantEmail,
      accountantName:  args.accountantName,
      exportScheduleDay: args.exportScheduleDay,
    });
  },
});
```

---

## Slice 2 — ZIP/Manifest into a Convex action

**Files:** `packages/types/src/exportUtils.ts` (new), `backend/convex/exports.ts` (new), `apps/dashboard/app/api/exports/[month]/route.ts` (refactor)

### exportUtils.ts
Move these pure functions out of the Next.js route:
`buildZip`, `buildManifestCsv`, `crc32`, `writeUint16`, `writeUint32`, `concat`, `csvCell`, `sanitizeZipName`

### exports.ts (new Convex file)
```ts
export const buildAccountantExportZip = internalAction({
  args: { userId: v.id('users'), month: v.string() },
  handler: async (ctx, { userId, month }) => {
    // 1. Query active documents for the user + month
    // 2. For each Primary Attachment with fileStorageId: ctx.storage.get(fileStorageId)
    // 3. Build Manifest CSV rows (originFromEmail ?? fromEmail, subject, receivedAt, etc.)
    // 4. Build ZIP using shared helpers from exportUtils.ts
    // 5. Return { zipBytes: Uint8Array, documentCount: number, month }
  },
});
```

### route.ts (refactor)
Replace the fetch-loop with:
```ts
const { zipBytes, documentCount } = await fetchAction(
  internal.exports.buildAccountantExportZip,
  { userId, month }
);
return new Response(zipBytes, { headers: { 'content-type': 'application/zip', ... } });
```

---

## Slice 3 — EmailSender interface + Resend adapter

**Files:** `backend/convex/email/types.ts`, `backend/convex/email/resendAdapter.ts`, `backend/convex/email/index.ts`, `backend/convex/email/templates.ts`

### types.ts
```ts
export type SendEmailParams = {
  to: string;
  cc?: string;
  fromName: string;
  subject: string;
  bodyHtml: string;
  attachment?: { filename: string; content: Uint8Array };
};

export interface EmailSender {
  send(params: SendEmailParams): Promise<void>;
}
```

### resendAdapter.ts
```ts
import { Resend } from 'resend';
export class ResendAdapter implements EmailSender {
  async send(params) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error('RESEND_API_KEY is not set');
    const client = new Resend(key);
    await client.emails.send({
      from: `${params.fromName} via MailToBills <exports@mailtobills.com>`,
      to: params.to,
      cc: params.cc,
      subject: params.subject,
      html: params.bodyHtml,
      attachments: params.attachment
        ? [{ filename: params.attachment.filename, content: Buffer.from(params.attachment.content).toString('base64') }]
        : undefined,
    });
  }
}
```

### index.ts
```ts
export function getEmailSender(): EmailSender {
  return new ResendAdapter(); // swap here for other providers
}
```

### templates.ts
Export three builders:
- `buildAccountantExportEmail({ customerName, month, year, accountantName? })` — ZIP email to accountant
- `buildEmptyMonthEmail({ customerName, month, year })` — skip notification to Customer
- `buildExportFailureEmail({ customerName, month, year, dashboardUrl })` — failure notification to Customer

All bodies in PT. Subject pattern: `MailToBills – Documentos de [Mês] [Ano]`

---

## Slice 4 — Export Schedule settings UI

**Files:** `apps/dashboard/components/export-schedule-form.tsx` (new), `apps/dashboard/app/(dashboard)/settings/page.tsx`

### export-schedule-form.tsx
`"use client"` component. Props: `accountantEmail?`, `accountantName?`, `exportScheduleDay?`.

Fields: email Input, name Input (optional), day Select (1–28, disabled until email valid), enable/disable button.

Preview line (pure helper):
```ts
function nextExportDate(today: Date, day: number) {
  // if today.getDate() < day → send date is this month, covering last month
  // if today.getDate() >= day → send date is next month, covering this month
}
// renders: "Next export: 5 Jul 2026, covering June 2026"
```

### settings/page.tsx
Pass the three new user fields as props to `<ExportScheduleForm>` inside a new `<SettingsRow>`:
```tsx
<SettingsRow
  title="Export Schedule"
  description="Automatically send your monthly Accountant Export to your accountant."
>
  <ExportScheduleForm
    accountantEmail={user?.accountantEmail ?? undefined}
    accountantName={user?.accountantName ?? undefined}
    exportScheduleDay={user?.exportScheduleDay ?? undefined}
  />
</SettingsRow>
```

---

## Slice 5 — Export Schedule daily cron

**Files:** `backend/convex/crons.ts` (new), `backend/convex/exports.ts` (additions), `backend/convex/users.ts` (new internal query)

### crons.ts
```ts
import { cronJobs } from 'convex/server';
const crons = cronJobs();
crons.daily(
  'send-scheduled-exports',
  { hourUTC: 7, minuteUTC: 0 },
  internal.exports.sendScheduledExports,
);
export default crons;
```

### sendScheduledExports action
```
1. today = new Date() in UTC; day = today.getUTCDate()
2. users = getUsersDueForExport(day)  ← new internalQuery
3. for each user: sendExportForUser(ctx, user) wrapped in try/catch
```

### sendExportForUser helper
```
1. previousMonth = 'YYYY-MM' for the month before today
2. if user.exportScheduleLastSentMonth === previousMonth → skip (idempotent)
3. { zipBytes, documentCount } = buildAccountantExportZip(userId, previousMonth)
4. if documentCount === 0:
     send buildEmptyMonthEmail to customer only; return
5. for attempt in [1,2,3]:
     try: emailSender.send(ZIP to accountant, CC customer); break
     catch: if attempt === 3: send buildExportFailureEmail to customer; return
6. db.patch(userId, { exportScheduleLastSentMonth: previousMonth })
```

### getUsersDueForExport (internalQuery in users.ts)
Table scan filtering `exportScheduleDay === day && accountantEmail != null`. Add index on `exportScheduleDay` later when user count grows.

---

## Slice 6 — "Send to accountant" button on manual export

**Files:** `backend/convex/exports.ts` (addition), `apps/dashboard/components/send-to-accountant-button.tsx` (new), `apps/dashboard/app/(dashboard)/m/[month]/page.tsx`

### sendManualExportToAccountant action
```ts
export const sendManualExportToAccountant = action({
  args: { month: v.string() },
  handler: async (ctx, { month }) => {
    const userId = await requireSignedInUserId(ctx);
    const user = await ctx.runQuery(internal.users.viewer);
    if (!user.accountantEmail) throw new Error('NO_ACCOUNTANT_EMAIL');
    const { zipBytes } = await ctx.runAction(internal.exports.buildAccountantExportZip, { userId, month });
    await getEmailSender().send({ to: user.accountantEmail, cc: user.email, ... });
    return { sentTo: user.accountantEmail };
  },
});
```

### send-to-accountant-button.tsx
`"use client"`. Props: `month`, `accountantEmail?`.
- No email → muted text "No accountant configured" + link to /settings
- Has email → Button. On click: call mutation, show loading, on success show "Sent to X ✓" for 4s, on error show inline message.

### m/[month]/page.tsx
Fetch user server-side, pass `accountantEmail` to `<SendToAccountantButton month={month} accountantEmail={user?.accountantEmail} />`. Place near existing export button.
