/**
 * The site must work with JavaScript blocked. Routing is done by :target,
 * so every page stays reachable; only the clock and the keypad are lost.
 */
import { expect, test } from "@playwright/test";
import { PAGES } from "./pages.js";

test("the index page renders without JavaScript", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#p100")).toBeVisible();
  await expect(page.getByRole("heading", { name: "JUUSO" })).toBeVisible();
});

for (const { id } of PAGES) {
  test(`#${id} is reachable without JavaScript`, async ({ page }) => {
    await page.goto(`/#${id}`);
    await expect(page.locator(`#${id}`)).toBeVisible();
  });
}

test("fastext links still navigate without JavaScript", async ({ page }) => {
  await page.goto("/");
  await page.locator('.tt-fastext a[href="#p400"]').click();
  await expect(page.locator("#p400")).toBeVisible();
});

test("no page content is lost when scripting is off", async ({ page }) => {
  await page.goto("/");
  for (const { id } of PAGES) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
  // The contact details must be in the served HTML, not injected by script.
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(1);
});
