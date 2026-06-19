# Testing

MailToBills uses a small test pyramid. Prefer the lowest layer that can cover
the behavior clearly.

## Commands

- `pnpm test` runs package tests through Turborepo.
- `pnpm typecheck` runs TypeScript checks in apps, shared packages, and Convex.
- `pnpm verify` runs lint, typecheck, build, and tests.
- `pnpm test:e2e` runs the Playwright smoke tests.

## Runners

- `packages/domain` uses `node:test` with `tsx` for pure TypeScript utilities.
- `apps/dashboard` uses Vitest, jsdom, and Testing Library for transforms and
  interactive React components.
- `backend/convex` uses Vitest with `convex-test` in the edge runtime for Convex
  queries and mutations.
- `e2e` uses Playwright for browser smoke coverage. Keep this suite small and
  avoid authenticated dashboard flows until the local Convex test deployment
  story is stable.

## Defaults

- Import workspace source through test aliases instead of depending on built
  `dist` output during watch-mode tests.
- Add pure business logic tests before component or browser tests.
- Keep Playwright out of `pnpm verify`; run it explicitly when changing routing,
  landing CTAs, or browser-only behavior.
