/**
 * Accessibility gate. Zero axe violations on every page state — this is what
 * actually enforces the contrast rules the palette is built around.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { PAGES, freezeClock } from "./pages.js";

for (const { id, no } of PAGES) {
  test(`page ${no} has no accessibility violations`, async ({ page }) => {
    await freezeClock(page);
    await page.goto(`/#${id}`);
    await expect(page.locator(`#${id}`)).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(
      results.violations.map((v) => `${v.id}: ${v.help}`),
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  });
}

test("the document has exactly one h1 and a language", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("navigating moves focus to the new page", async ({ page }) => {
  await freezeClock(page);
  await page.goto("/");
  await page.locator('.tt-fastext a[href="#p300"]').click();
  await expect(page.locator("#p300")).toBeFocused();
});

test("the script does not steal focus on a plain first load", async ({ page }) => {
  await freezeClock(page);
  await page.goto("/");
  const active = await page.evaluate(() => document.activeElement?.tagName);
  expect(active).toBe("BODY");
});

test("loading a deep link focuses that page, as fragment navigation should", async ({
  page,
}) => {
  await freezeClock(page);
  await page.goto("/#p200");
  await expect(page.locator("#p200")).toBeFocused();
});
