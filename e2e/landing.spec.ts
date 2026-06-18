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

  const signIn = page.getByRole("link", { name: /sign in/i }).first();
  await expect(signIn).toHaveAttribute("href", /localhost:3000|\/signin/);
});
