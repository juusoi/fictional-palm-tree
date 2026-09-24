/**
 * Guards the small text files that configure hosting. They are easy to get
 * subtly wrong, nothing else reads them, and a mistake only shows up as a
 * custom domain that quietly stopped working.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("CNAME holds one bare hostname", () => {
  const raw = read("CNAME");
  const lines = raw.split("\n").filter((line) => line.trim() !== "");

  assert.equal(lines.length, 1, "CNAME must contain exactly one hostname");

  const host = lines[0];
  assert.doesNotMatch(host, /^https?:/, "no scheme");
  assert.doesNotMatch(host, /\//, "no path or trailing slash");
  assert.doesNotMatch(host, /\s/, "no whitespace");
  assert.match(host, /^[a-z0-9-]+(\.[a-z0-9-]+)+$/, "looks like a hostname");
});

test("the canonical URL matches the CNAME host", () => {
  const host = read("CNAME").trim();
  const html = read("index.html");

  const match = html.match(/<link rel="canonical" href="([^"]+)"/);
  assert.ok(match, "index.html has no canonical link");

  const canonical = new URL(match[1]);
  assert.equal(canonical.host, host, "canonical host has drifted from CNAME");
  assert.equal(canonical.protocol, "https:", "canonical must be https");
});

test("robots.txt allows crawling", () => {
  const robots = read("robots.txt");
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
});
