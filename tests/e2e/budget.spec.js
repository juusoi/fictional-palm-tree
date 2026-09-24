/**
 * Page-weight budget. This replaces a Lighthouse performance score, which for
 * a dependency-free static page is a foregone conclusion and was costing five
 * unfixable high-severity advisories in @lhci/cli to measure.
 *
 * What actually needs guarding is the thing that quietly rots: somebody adds
 * a web font, an icon set, or a 400KB hero image. This catches that on the
 * commit that does it.
 */
import { expect, test } from "@playwright/test";

const MAX_REQUESTS = 8;
const MAX_BYTES = 60 * 1024;

test("a cold load stays inside the page-weight budget", async ({ page }) => {
  const responses = [];
  page.on("response", (response) => responses.push(response));

  await page.goto("/", { waitUntil: "networkidle" });

  const sizes = await Promise.all(
    responses.map(async (response) => {
      try {
        return (await response.body()).byteLength;
      } catch {
        return 0;
      }
    }),
  );
  const total = sizes.reduce((sum, n) => sum + n, 0);

  const summary = responses
    .map((r, i) => `${r.url().split("/").pop() || "/"} ${sizes[i]}B`)
    .join(", ");

  expect(responses.length, `too many requests — ${summary}`).toBeLessThanOrEqual(
    MAX_REQUESTS,
  );
  expect(total, `page weight ${total}B — ${summary}`).toBeLessThanOrEqual(MAX_BYTES);
});

test("the whole site is served from a handful of known files", async ({ page }) => {
  // The favicon is not in the required list: headless browsers do not always
  // request it, and asserting on it would be a cross-engine flake.
  const ALLOWED = [
    "/",
    "/assets/css/teletext.css",
    "/assets/img/favicon.svg",
    "/assets/js/core.js",
    "/assets/js/teletext.js",
  ];
  const REQUIRED = [
    "/",
    "/assets/css/teletext.css",
    "/assets/js/core.js",
    "/assets/js/teletext.js",
  ];

  const paths = new Set();
  page.on("request", (request) => paths.add(new URL(request.url()).pathname));

  await page.goto("/", { waitUntil: "networkidle" });

  const unexpected = [...paths].filter((p) => !ALLOWED.includes(p));
  expect(unexpected, `unexpected requests: ${unexpected}`).toEqual([]);

  for (const required of REQUIRED) {
    expect([...paths], `${required} was never requested`).toContain(required);
  }
});
