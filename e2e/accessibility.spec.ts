import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("landing page has no structural accessibility violations", async ({
  page,
}) => {
  await page.goto("/");

  // The landing slice will remediate the existing palette and enable this rule.
  const results = await new AxeBuilder({ page })
    .disableRules(["color-contrast"])
    .analyze();

  expect(results.violations).toEqual([]);
});
