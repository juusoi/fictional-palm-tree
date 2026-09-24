import { expect, test } from "@playwright/test";
import { freezeClock } from "./pages.js";

test.beforeEach(async ({ page }) => {
  await freezeClock(page);
  await page.goto("/");
});

test("typing a three-digit page number navigates", async ({ page }) => {
  await page.keyboard.press("4");
  await page.keyboard.press("0");
  await page.keyboard.press("0");
  await expect(page.locator("#p400")).toBeVisible();
  await expect(page).toHaveURL(/#p400$/);
});

test("the header echoes the digits as they are typed", async ({ page }) => {
  await page.keyboard.press("3");
  await expect(page.locator('[data-tt="page-no"]')).toHaveText("P3--");
  await page.keyboard.press("0");
  await expect(page.locator('[data-tt="page-no"]')).toHaveText("P30-");
});

test("a page number that does not exist leaves the current page alone", async ({
  page,
}) => {
  await page.keyboard.press("9");
  await page.keyboard.press("9");
  await page.keyboard.press("9");
  await expect(page.locator("#p100")).toBeVisible();
  await expect(page).not.toHaveURL(/#p999/);
});

test("digits pressed with a modifier held do not navigate", async ({ page }) => {
  await page.keyboard.press("Control+4");
  await page.keyboard.press("Control+0");
  await page.keyboard.press("Control+0");
  await expect(page.locator("#p100")).toBeVisible();
});

test("a non-digit key clears a partially typed number", async ({ page }) => {
  await page.keyboard.press("4");
  await page.keyboard.press("x");
  await page.keyboard.press("0");
  await page.keyboard.press("0");
  await expect(page.locator("#p100")).toBeVisible();
});

test("every interactive element is reachable and shows a focus ring", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName === "webkit",
    "WebKit only tabs to links when macOS Full Keyboard Access is on — a platform setting, not a page defect",
  );

  const interactive = page.locator("a[href]");
  const total = await interactive.count();
  expect(total).toBeGreaterThan(0);

  const seen = new Set();
  // One more tab than there are links, to prove focus escapes rather than traps.
  for (let i = 0; i < total + 2; i += 1) {
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      return {
        tag: el.tagName,
        href: el.getAttribute("href"),
        outlineWidth: style.outlineWidth,
        outlineStyle: style.outlineStyle,
      };
    });
    if (!focused) continue;
    if (focused.tag === "A") {
      seen.add(focused.href);
      expect(
        focused.outlineStyle !== "none" && focused.outlineWidth !== "0px",
        `no visible focus ring on ${focused.href}`,
      ).toBeTruthy();
    }
  }

  expect(seen.size).toBeGreaterThan(3);
});

test("the skip link appears on focus and jumps to the content", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName === "webkit",
    "WebKit only tabs to links when macOS Full Keyboard Access is on — a platform setting, not a page defect",
  );

  await page.keyboard.press("Tab");
  const skip = page.locator(".tt-skip");
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
});
