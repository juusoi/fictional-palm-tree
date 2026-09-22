/**
 * Layout guarantees that hold on every engine and platform, so they can run
 * in CI without a pixel baseline. The 40-column grid is the whole premise of
 * the design: if it stops fitting, the site is broken even if it still looks
 * plausible in a screenshot.
 */
import { expect, test } from "@playwright/test";
import { PAGES, freezeClock } from "./pages.js";

const WIDTHS = [320, 390, 768, 1440];

for (const width of WIDTHS) {
  test(`no horizontal scrolling at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await freezeClock(page);
    await page.goto("/");

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflows, "the page scrolls sideways").toBe(false);
  });

  test(`the 40-column grid fits at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await freezeClock(page);
    await page.goto("/");

    // .tt-mosaic is exactly 40 characters wide by construction.
    const fits = await page.evaluate(() => {
      const rule = document.querySelector(".tt-mosaic");
      return rule.scrollWidth <= rule.clientWidth + 1;
    });
    expect(fits, "the 40-character rule is being clipped").toBe(true);
  });
}

for (const { id, no } of PAGES) {
  test(`page ${no} keeps its content inside the screen`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await freezeClock(page);
    await page.goto(`/#${id}`);
    await expect(page.locator(`#${id}`)).toBeVisible();

    const spills = await page.evaluate((pageId) => {
      const screen = document.querySelector(".tt-screen");
      const limit = screen.getBoundingClientRect().right + 1;
      return Array.from(document.querySelectorAll(`#${pageId} *`))
        .filter((el) => el.getBoundingClientRect().right > limit)
        .map((el) => el.className || el.tagName);
    }, id);

    expect(spills, `elements overflow the screen: ${spills}`).toEqual([]);
  });
}

test("the fastext bar keeps all four links on one row", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/");

  const tops = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".tt-fastext li")).map((li) =>
      Math.round(li.getBoundingClientRect().top),
    ),
  );
  expect(new Set(tops).size, "the fastext bar wrapped onto two rows").toBe(1);
});
