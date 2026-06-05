# MailToBills

Forward your invoices. We organize everything.

MailToBills is a micro-SaaS that lets freelancers and small businesses forward invoice emails and get everything neatly organized in a simple dashboard.

---

## Monorepo layout

- `apps/landing`  
  Public marketing site (Next.js)

- `apps/dashboard`  
  Authenticated dashboard (Next.js + Convex)

- `backend/convex`  
  Convex backend (schema, queries, mutations)

- `packages/ui`  
  Shared React UI components (shadcn/ui + Tailwind)

- `packages/types`  
  Shared TypeScript types

- `packages/config`  
  Shared configs (ESLint, tsconfig, etc.)

- `workflows/n8n`  
  Email ingestion workflows (JSON exports)

---

## Development

Install dependencies:

```bash
pnpm install
```

Run everything via Turborepo:

```bash
pnpm dev
```

You can also run app-specific scripts inside each package if needed.

---

## UI components (shadcn/ui)

This repo uses **shadcn/ui** in a monorepo setup.

### Adding components

Run from the repo root and target the dashboard app:

```bash
pnpm dlx shadcn@latest add button -c apps/dashboard
```

Components are generated into:

```
packages/ui/src/components
```

### Using components

Import shared components from the UI package:

```tsx
import { Button } from "@mailtobills/ui/components/button";
```

Tailwind is already configured to work across apps and the shared UI package.

---

## Auth env (OAuth / Convex)

For `@convex-dev/auth` OAuth redirects, the Convex backend must know the dashboard base URL.

Set one of the following env vars to the dashboard origin:

```
SITE_URL=http://localhost:3001
```

or

```
CONVEX_SITE_URL=http://localhost:3001
```

Adjust for preview/production environments accordingly.

### Local dashboard QA account

For repeatable local visual QA, the dashboard can show a development-only
shortcut on `/signin`. Add these to `apps/dashboard/.env` or
`apps/dashboard/.env.local`:

```
NEXT_PUBLIC_DEV_AUTH_EMAIL=visual-qa@mailtobills.local
NEXT_PUBLIC_DEV_AUTH_PASSWORD=<local-only-password>
```

When both values are present and `NODE_ENV=development`, the sign-in page shows
`Use dev account`. It signs in with that password account, or creates it if it
does not exist. Do not set these variables in production.

---

## For AI-assisted development

AI agents **must** follow `AGENTS.md` strictly.  
If there is any conflict, `AGENTS.md` is the source of truth.
