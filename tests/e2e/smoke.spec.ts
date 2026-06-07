import { expect, test } from "@playwright/test";

test("mobile BELIFE shell opens demo flow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "BELIFE" })).toBeVisible();
  await page.getByRole("link", { name: "Talk now" }).click();
  await expect(page.getByRole("heading", { name: "Talk to BELIFE" })).toBeVisible();
});
