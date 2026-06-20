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

for (const { heading, lang, locale, path, title } of [
  {
    heading: "Page not found",
    lang: "en",
    locale: "English",
    path: "/missing-page",
    title: "Page not found · MailToBills",
  },
  {
    heading: "Página não encontrada",
    lang: "pt-PT",
    locale: "Portuguese",
    path: "/pt-PT/missing-page",
    title: "Página não encontrada · MailToBills",
  },
]) {
  test(`${locale} not-found page preserves locale and landmarks`, async ({
    page,
    request,
  }) => {
    const crawlerResponse = await request.get(path, {
      headers: { "user-agent": "Googlebot/2.1" },
    });
    const crawlerHtml = await crawlerResponse.text();
    const crawlerHead = crawlerHtml.match(/<head>([\s\S]*?)<\/head>/)?.[1];

    expect(crawlerResponse.status()).toBe(404);
    expect(crawlerHtml).toContain(`<html lang="${lang}"`);
    expect(crawlerHead).toContain(`<title>${title}</title>`);
    expect(crawlerHead).toContain('<meta name="robots" content="noindex"/>');
    expect(crawlerHead).not.toContain('rel="canonical"');
    expect(crawlerHead).not.toContain('property="og:title"');

    const response = await page.goto(path);

    expect(response?.status()).toBe(404);
    await expect(page).toHaveTitle(title);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(
      page.locator('meta[name="robots"][content*="noindex"]'),
    ).toHaveCount(1);
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
    await expect(page.locator("main")).toHaveCount(1);

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
