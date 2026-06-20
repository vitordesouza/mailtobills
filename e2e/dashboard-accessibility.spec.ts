import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("sign-in is accessible and can switch locale", async ({ page }) => {
  await page.goto("/signin");

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", { name: "Welcome back", exact: true }),
  ).toBeVisible();
  await expect(page.locator("main")).toHaveCount(1);

  const englishResults = await new AxeBuilder({ page }).analyze();
  expect(englishResults.violations).toEqual([]);

  await page.getByLabel("Language").selectOption("pt-PT");

  await expect(page.locator("html")).toHaveAttribute("lang", "pt-PT");
  await expect(
    page.getByRole("heading", { name: "Bem-vindo de volta", exact: true }),
  ).toBeVisible();

  const portugueseResults = await new AxeBuilder({ page }).analyze();
  expect(portugueseResults.violations).toEqual([]);
});
