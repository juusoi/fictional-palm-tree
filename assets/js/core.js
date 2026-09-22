/**
 * Pure logic for the teletext UI. No DOM, no globals — everything here is
 * unit tested in Node (tests/unit/core.test.js). Anything that touches the
 * document belongs in teletext.js instead.
 */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** How long a partially typed page number survives before it is discarded. */
export const KEYPAD_RESET_MS = 2000;

/** The page shown when the hash is missing or does not name a real page. */
export const DEFAULT_PAGE = "p100";

/**
 * Format a date as the teletext header clock: "22 Sep 18:42".
 *
 * @param {Date} date
 * @returns {string}
 */
export function formatClock(date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mon = MONTHS[date.getMonth()];
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${dd} ${mon} ${hh}:${mm}`;
}

/**
 * The three-digit keypad state machine.
 *
 * Feed it one key at a time. Non-digits clear the buffer. A gap longer than
 * KEYPAD_RESET_MS since the last digit also clears it, so a page number typed
 * minutes apart is never accidentally assembled.
 *
 * @param {{digits: string, at: number}} state previous state
 * @param {string} key the key that was pressed
 * @param {number} now monotonic-ish timestamp in ms
 * @returns {{digits: string, at: number, page: string|null}} next state, plus
 *   the page id once three digits have been collected
 */
export function parsePageInput(state, key, now) {
  if (!/^[0-9]$/.test(key)) {
    return { digits: "", at: now, page: null };
  }

  const expired = now - state.at > KEYPAD_RESET_MS;
  const digits = ((expired ? "" : state.digits) + key).slice(-3);

  if (digits.length === 3) {
    return { digits: "", at: now, page: `p${digits}` };
  }
  return { digits, at: now, page: null };
}

/**
 * Resolve a location hash to a page id, falling back to the index page when
 * the hash is absent, malformed, or names a page that does not exist.
 *
 * @param {string} hash e.g. "#p300"
 * @param {readonly string[]} knownPages
 * @param {string} [fallback]
 * @returns {string}
 */
export function resolveRoute(hash, knownPages, fallback = DEFAULT_PAGE) {
  const id = String(hash ?? "").replace(/^#/, "");
  return knownPages.includes(id) ? id : fallback;
}

/**
 * The header page label for a page id: "p300" -> "P300".
 *
 * @param {string} pageId
 * @returns {string}
 */
export function pageLabel(pageId) {
  return /^p\d{3}$/.test(pageId) ? pageId.toUpperCase() : "P___";
}
