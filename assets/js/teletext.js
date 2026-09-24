/**
 * DOM wiring for the teletext UI. Progressive enhancement only — the page
 * routes itself with :target and reads fine with this script blocked.
 */

import {
  DEFAULT_PAGE,
  formatClock,
  pageLabel,
  parsePageInput,
  resolveRoute,
} from "./core.js";

const root = document.documentElement;
const pages = Array.from(document.querySelectorAll(".tt-page"));
const pageIds = pages.map((page) => page.id);
const clockEl = document.querySelector('[data-tt="clock"]');
const pageNoEl = document.querySelector('[data-tt="page-no"]');

let keypad = { digits: "", at: 0 };
let userNavigated = false;

root.classList.add("js");

/* ---------- clock ---------- */

function tickClock() {
  if (clockEl) clockEl.textContent = formatClock(new Date());
}

/* ---------- routing ---------- */

function render() {
  const current = resolveRoute(window.location.hash, pageIds, DEFAULT_PAGE);

  for (const page of pages) {
    page.classList.toggle("is-current", page.id === current);
  }

  if (pageNoEl) pageNoEl.textContent = pageLabel(current);

  const heading = document.querySelector(`#${current} h1, #${current} h2`);
  document.title = `${pageLabel(current)} — ${
    heading ? heading.textContent.trim() : "Juuso Issakainen"
  }`;

  // Move focus to the page only in response to a navigation the user made,
  // never on first load — stealing focus on load is hostile to screen readers.
  if (userNavigated) {
    const target = document.getElementById(current);
    if (target) target.focus({ preventScroll: true });
  }
}

/* ---------- keypad ---------- */

function isTypingElsewhere(event) {
  const el = event.target;
  return (
    el instanceof HTMLElement &&
    (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))
  );
}

function onKeyDown(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (isTypingElsewhere(event)) return;

  const next = parsePageInput(keypad, event.key, Date.now());
  keypad = { digits: next.digits, at: next.at };

  // Echo the partial number into the header, the way a real set does.
  if (pageNoEl && next.digits) {
    pageNoEl.textContent = `P${next.digits.padEnd(3, "-")}`;
  }

  if (next.page) {
    if (pageIds.includes(next.page)) {
      userNavigated = true;
      window.location.hash = `#${next.page}`;
    }
    render();
  }
}

/* ---------- wiring ---------- */

window.addEventListener("hashchange", () => {
  userNavigated = true;
  render();
});

document.addEventListener("keydown", onKeyDown);

tickClock();
window.setInterval(tickClock, 1000);
render();
