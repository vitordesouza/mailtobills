import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const { locale, path } of [
  { locale: "English", path: "/" },
  { locale: "Portuguese", path: "/pt-PT" },
]) {
  test(`${locale} landing page has no accessibility violations`, async ({
    page,
  }) => {
    await page.goto(path);
    await page.waitForFunction(() =>
      document
        .getAnimations()
        .every((animation) => animation.playState === "finished"),
    );

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });
}

for (const { heading, lang, locale, path } of [
  {
    heading: "Page not found",
    lang: "en",
    locale: "English",
    path: "/missing-page",
  },
  {
    heading: "Página não encontrada",
    lang: "pt-PT",
    locale: "Portuguese",
    path: "/pt-PT/missing-page",
  },
]) {
  test(`${locale} not-found page preserves locale and landmarks`, async ({
    page,
  }) => {
    const response = await page.goto(path);

    expect(response?.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
    await expect(page.locator("main")).toHaveCount(1);

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
