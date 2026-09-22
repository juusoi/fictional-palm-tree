import { expect, test } from "@playwright/test";
import { PAGES, freezeClock } from "./pages.js";

test.beforeEach(async ({ page }) => {
  await freezeClock(page);
});

test("the index page is shown when no hash is present", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#p100")).toBeVisible();
  await expect(page.locator("#p300")).toBeHidden();
  await expect(page.locator('[data-tt="page-no"]')).toHaveText("P100");
});

test("the header clock renders the frozen time", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-tt="clock"]')).toHaveText("22 Sep 18:42");
});

for (const { id, no } of PAGES) {
  test(`deep-linking #${id} shows only that page`, async ({ page }) => {
    await page.goto(`/#${id}`);
    await expect(page.locator(`#${id}`)).toBeVisible();
    await expect(page.locator('[data-tt="page-no"]')).toHaveText(`P${no}`);

    const others = PAGES.filter((p) => p.id !== id);
    for (const other of others) {
      await expect(page.locator(`#${other.id}`)).toBeHidden();
    }
  });
}

test("every fastext link navigates", async ({ page }) => {
  await page.goto("/");
  const bar = page.locator(".tt-fastext a");
  const count = await bar.count();
  expect(count).toBe(4);

  for (let i = 0; i < count; i += 1) {
    await page.goto("/");
    const link = page.locator(".tt-fastext a").nth(i);
    const href = await link.getAttribute("href");
    await link.click();
    await expect(page.locator(href)).toBeVisible();
  }
});

test("every index menu link navigates", async ({ page }) => {
  const links = PAGES.filter((p) => p.id !== "p100");
  for (const { id, label } of links) {
    await page.goto("/");
    await page
      .getByRole("link", { name: new RegExp(label, "i") })
      .first()
      .click();
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
});

test("back and forward restore the previous page", async ({ page }) => {
  await page.goto("/");
  await page.locator('a[href="#p300"]').first().click();
  await expect(page.locator("#p300")).toBeVisible();

  await page.goBack();
  await expect(page.locator("#p100")).toBeVisible();

  await page.goForward();
  await expect(page.locator("#p300")).toBeVisible();
});

test("an unknown hash falls back to the index instead of a blank screen", async ({
  page,
}) => {
  await page.goto("/#p999");
  await expect(page.locator("#p100")).toBeVisible();
  await expect(page.locator('[data-tt="page-no"]')).toHaveText("P100");
});

test("the document title tracks the current page", async ({ page }) => {
  await page.goto("/#p400");
  await expect(page).toHaveTitle(/P400/);
});
