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
