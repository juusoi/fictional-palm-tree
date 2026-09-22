/**
 * Security guards. These exist to stop a future edit from quietly weakening
 * the page: an inline handler, a CDN font, an external link without
 * noopener. Each one would be invisible in review and obvious here.
 */
import { expect, test } from "@playwright/test";
import { BASE_URL } from "../config.js";
import { PAGES, freezeClock } from "./pages.js";

const REQUIRED_DIRECTIVES = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "connect-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
];

test("the content security policy is present and strict", async ({ page }) => {
  await page.goto("/");
  const csp = await page
    .locator('meta[http-equiv="Content-Security-Policy"]')
    .getAttribute("content");

  expect(csp, "CSP meta tag is missing").not.toBeNull();
  for (const directive of REQUIRED_DIRECTIVES) {
    expect(csp, `CSP is missing: ${directive}`).toContain(directive);
  }
  expect(csp).not.toContain("unsafe-inline");
  expect(csp).not.toContain("unsafe-eval");
});

test("the referrer policy is declared in markup", async ({ page }) => {
  // The host (GitHub Pages) cannot send a Referrer-Policy header, so this
  // meta tag is the only thing carrying it. If it goes, the policy goes.
  await page.goto("/");
  const referrer = await page.locator('meta[name="referrer"]').getAttribute("content");
  expect(referrer, "the referrer meta tag is missing").toBe("no-referrer");
});

test("there is no inline script, style or event handler", async ({ page }) => {
  await page.goto("/");

  const offenders = await page.evaluate(() => {
    const found = [];
    for (const el of document.querySelectorAll("script")) {
      if (!el.src) found.push("inline <script>");
    }
    for (let i = 0; i < document.querySelectorAll("style").length; i += 1) {
      found.push("inline <style>");
    }
    for (const el of document.querySelectorAll("*")) {
      if (el.hasAttribute("style")) found.push(`style= on <${el.tagName}>`);
      for (const attr of el.attributes) {
        if (attr.name.startsWith("on")) {
          found.push(`${attr.name}= on <${el.tagName}>`);
        }
      }
    }
    return found;
  });

  expect(offenders).toEqual([]);
});

test("the page loads nothing from a third-party origin", async ({ page }) => {
  const ownOrigin = new URL(BASE_URL).origin;
  const foreign = [];
  page.on("request", (request) => {
    // The listener is attached before the first navigation, so page.url() is
    // still about:blank here — compare against the configured origin instead.
    if (new URL(request.url()).origin !== ownOrigin) {
      foreign.push(request.url());
    }
  });

  await page.goto("/");
  await freezeClock(page);
  for (const { id } of PAGES) {
    await page.goto(`/#${id}`);
  }

  expect(foreign, `unexpected third-party requests: ${foreign}`).toEqual([]);
});

test("every external link carries noopener and noreferrer", async ({ page }) => {
  await page.goto("/");

  const bad = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a[href]"))
      .filter((a) => /^https?:/i.test(a.getAttribute("href")))
      .filter((a) => {
        const rel = (a.getAttribute("rel") || "").toLowerCase();
        return !rel.includes("noopener") || !rel.includes("noreferrer");
      })
      .map((a) => a.getAttribute("href")),
  );

  expect(bad, `external links missing rel: ${bad}`).toEqual([]);
});

test("no subresource points outside the origin", async ({ page }) => {
  await page.goto("/");

  const external = await page.evaluate(() => {
    // Only rel values that actually cause a fetch. rel="canonical" points at
    // the public URL by design and is never requested, so counting it would
    // be a false positive.
    const FETCHING_REL = new Set([
      "stylesheet",
      "icon",
      "shortcut",
      "apple-touch-icon",
      "mask-icon",
      "preload",
      "modulepreload",
      "prefetch",
      "preconnect",
      "dns-prefetch",
      "manifest",
    ]);

    const urls = [];
    for (const el of document.querySelectorAll("[src]")) {
      urls.push(el.getAttribute("src"));
    }
    for (const el of document.querySelectorAll("link[href]")) {
      const rels = (el.getAttribute("rel") || "").toLowerCase().split(/\s+/);
      if (rels.some((rel) => FETCHING_REL.has(rel))) {
        urls.push(el.getAttribute("href"));
      }
    }
    return urls.filter((value) => value && /^(https?:)?\/\//i.test(value));
  });

  expect(external, `external subresources: ${external}`).toEqual([]);
});

test("the canonical URL is the production HTTPS origin", async ({ page }) => {
  await page.goto("/");
  const href = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(href).toBe("https://juuso.issakainen.fi/");
});
