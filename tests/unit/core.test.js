import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_PAGE,
  KEYPAD_RESET_MS,
  formatClock,
  pageLabel,
  parsePageInput,
  resolveRoute,
} from "../../assets/js/core.js";

const PAGES = ["p100", "p200", "p300", "p400", "p500", "p600"];

test("formatClock pads day, hour and minute", () => {
  assert.equal(formatClock(new Date(2026, 8, 5, 7, 4)), "05 Sep 07:04");
});

test("formatClock handles the first and last month", () => {
  assert.equal(formatClock(new Date(2026, 0, 1, 0, 0)), "01 Jan 00:00");
  assert.equal(formatClock(new Date(2026, 11, 31, 23, 59)), "31 Dec 23:59");
});

test("parsePageInput assembles three digits into a page", () => {
  let state = { digits: "", at: 0 };
  let out = parsePageInput(state, "3", 1000);
  assert.equal(out.page, null);
  assert.equal(out.digits, "3");

  out = parsePageInput(out, "0", 1100);
  assert.equal(out.page, null);
  assert.equal(out.digits, "30");

  out = parsePageInput(out, "0", 1200);
  assert.equal(out.page, "p300");
  assert.equal(out.digits, "", "buffer resets once a page is produced");
});

test("parsePageInput discards a stale partial number", () => {
  let out = parsePageInput({ digits: "", at: 0 }, "3", 1000);
  out = parsePageInput(out, "0", 1000 + KEYPAD_RESET_MS + 1);
  assert.equal(out.digits, "0", "the stale '3' is dropped, not prepended");
  assert.equal(out.page, null);
});

test("parsePageInput keeps a partial number that is still fresh", () => {
  let out = parsePageInput({ digits: "", at: 0 }, "3", 1000);
  out = parsePageInput(out, "0", 1000 + KEYPAD_RESET_MS);
  assert.equal(out.digits, "30");
});

test("parsePageInput clears the buffer on any non-digit key", () => {
  let out = parsePageInput({ digits: "", at: 0 }, "3", 1000);
  for (const key of ["a", "Enter", "Escape", " ", "ArrowLeft", "Shift"]) {
    const cleared = parsePageInput(out, key, 1100);
    assert.equal(cleared.digits, "", `"${key}" should clear the buffer`);
    assert.equal(cleared.page, null);
  }
});

test("parsePageInput never grows past three digits", () => {
  let out = { digits: "", at: 0 };
  for (const key of ["1", "2", "3", "4", "5", "6"]) {
    out = parsePageInput(out, key, 1000);
  }
  assert.ok(out.digits.length < 3);
});

test("resolveRoute accepts a known page", () => {
  assert.equal(resolveRoute("#p400", PAGES), "p400");
  assert.equal(resolveRoute("p400", PAGES), "p400", "a bare id also resolves");
});

test("resolveRoute falls back for absent, unknown and malformed hashes", () => {
  for (const hash of ["", "#", "#p999", "#nope", "#p40", undefined, null]) {
    assert.equal(resolveRoute(hash, PAGES), DEFAULT_PAGE, `hash: ${hash}`);
  }
});

test("resolveRoute honours an explicit fallback", () => {
  assert.equal(resolveRoute("#p999", PAGES, "p600"), "p600");
});

test("pageLabel upper-cases a valid id and degrades safely", () => {
  assert.equal(pageLabel("p300"), "P300");
  assert.equal(pageLabel("nonsense"), "P___");
});
