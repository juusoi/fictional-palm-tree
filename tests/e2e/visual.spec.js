/**
 * Visual regression. Chromium only (see playwright.config.js) — comparing
 * font rasterisation across three engines produces noise, not signal.
 *
 * Determinism: the clock is frozen and motion is disabled project-wide, so a
 * diff here means the layout actually changed.
 *
 * Platform: Playwright suffixes baselines with the OS, and text rasterises
 * differently on macOS and Linux, so the committed macOS baselines cannot be
 * compared on a Linux CI runner. Rather than let CI silently pass against a
 * missing baseline, these tests skip loudly off macOS. To enable them in CI,
 * generate Linux baselines once inside the official Playwright container:
 *
 *   docker run --rm -v "$PWD":/w -w /w mcr.microsoft.com/playwright:v1.49.1-noble \
 *     sh -c "npm ci && npx playwright test visual --update-snapshots"
 *
 * and commit the resulting *-linux.png files.
 *
 * The platform-independent half of this coverage lives in layout.spec.js and
 * runs everywhere.
 */
import { expect, test } from "@playwright/test";
import { PAGES, freezeClock } from "./pages.js";

const WIDTHS = [320, 390, 768, 1440];

test.skip(
  process.platform !== "darwin",
  "pixel baselines are committed for macOS only — see the note above",
);

for (const width of WIDTHS) {
  test(`index page at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await freezeClock(page);
    await page.goto("/");
    await expect(page.locator("#p100")).toBeVisible();
    await expect(page).toHaveScreenshot(`index-${width}.png`, {
      fullPage: true,
    });
  });
}

for (const { id, no } of PAGES) {
  test(`page ${no} at 390px`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await freezeClock(page);
    await page.goto(`/#${id}`);
    await expect(page.locator(`#${id}`)).toBeVisible();
    await expect(page).toHaveScreenshot(`page-${no}-390.png`, {
      fullPage: true,
    });
  });
}
