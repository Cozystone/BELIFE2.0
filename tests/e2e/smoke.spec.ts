import { expect, test } from "@playwright/test";

test("mobile BELIFE shell routes protected app to native sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "BELIFE" })).toBeVisible();
  await page.getByRole("link", { name: "Talk now" }).click();
  await expect(page.getByRole("heading", { name: "Sign in to BELIFE" })).toBeVisible();
});

test("public start flow goes through sign-up before onboarding", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Start/ }).click();
  await expect(page.getByRole("heading", { name: "Create your BELIFE" })).toBeVisible();
});
