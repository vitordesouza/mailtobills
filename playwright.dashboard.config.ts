import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_DASHBOARD_PORT ?? "3000");
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: /dashboard-.*\.spec\.ts/,
  timeout: 30_000,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: `NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210 CONVEX_SITE_URL=http://127.0.0.1:3211 pnpm --filter @mailtobills/dashboard exec next dev --turbopack -p ${port}`,
    url: `${baseURL}/signin`,
    reuseExistingServer:
      process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === "true",
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
