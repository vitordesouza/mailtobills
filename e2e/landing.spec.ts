import { expect, test } from "@playwright/test";

test("landing page loads and sign-in CTA points to the dashboard", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /stop chasing expense pdfs every month/i,
    }),
  ).toBeVisible();
  await expect(page).toHaveTitle(
    "MailToBills — Stop chasing expense PDFs every month",
  );
  await expect(
    page.locator('link[rel="alternate"][hreflang="pt-PT"]'),
  ).toHaveAttribute("href", /\/pt-PT$/);

  const signIn = page.getByRole("link", { name: /sign in/i }).first();
  await expect(signIn).toHaveAttribute("href", /localhost:3000|\/signin/);
});

test("language navigation keeps English at root and exposes Portuguese", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("link", { name: "PT", exact: true }).click();

  await expect(page).toHaveURL(/\/pt-PT\/?$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-PT");
  await expect(
    page.getByRole("heading", {
      name: /pare de procurar pdfs de despesas todos os meses/i,
    }),
  ).toBeVisible();
  await expect(page).toHaveTitle(
    "MailToBills — Pare de procurar PDFs de despesas todos os meses",
  );

  await page.getByRole("link", { name: "EN", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("skip link moves keyboard focus to the main content", async ({ page }) => {
  await page.goto("/");

  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();

  await skipLink.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

for (const { cta, path, width } of [
  { cta: "Get started", path: "/", width: 360 },
  { cta: "Get started", path: "/", width: 375 },
  { cta: "Começar", path: "/pt-PT", width: 768 },
]) {
  test(`header fits ${width}px viewport on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(path);

    await expect(
      page.getByRole("link", { name: cta, exact: true }),
    ).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
}
