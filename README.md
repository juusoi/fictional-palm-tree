# fictional-palm-tree

A teletext-styled "about me" portfolio for Juuso Issakainen.

Eight-colour teletext palette, a 40-column grid that holds its shape from a
320px phone upwards, double-height headings, a header clock, and a FASTEXT
colour bar. Modern reading UX underneath the 1980s surface.

- **Zero runtime dependencies.** No framework, no build step, no CDN, no
  fonts or analytics fetched from anywhere. The browser gets one HTML file,
  one stylesheet, two ES modules and an SVG favicon.
- **Works with JavaScript off.** Routing is done with `:target`, so every
  page is reachable without a line of script. JS only adds the live clock,
  the keypad shortcut, focus management and the page title.
- **Dev dependencies are for verification only** — tests and linters. None
  of it ships.

## Content

> [!IMPORTANT]
> The copy is a **draft template, not a verified bio**. Only "QA engineer",
> "Nitor", the GitHub handle and the email address are real. Everything else
> is placeholder text, each block marked in `index.html` with
> `<!-- TODO(juuso): verify -->`. Search for that string and rewrite before
> this goes anywhere public.

## Run it

```sh
npm run serve      # http://127.0.0.1:4173
```

`tests/server.js` is a ~50-line Node static server — no npm server package to
audit, and unlike `python3 -m http.server` it does not drop requests under
parallel Playwright workers (which used to look exactly like an application
bug: the page still routed, but the script never loaded).

## Test it

```sh
npm test           # lint + unit + end-to-end
npm run test:unit  # node:test, no dependencies, runs in milliseconds
npm run test:e2e   # Playwright: navigation, keyboard, no-JS, a11y, security, layout, budget, visual
npm run links      # external link check
```

| Suite                          | What it protects                                                                                                                              |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/unit/`                  | The keypad state machine, route resolution and clock formatting — the only real logic in the codebase                                         |
| `tests/e2e/navigation.spec.js` | Deep links, fastext bar, back/forward, unknown-hash fallback                                                                                  |
| `tests/e2e/keyboard.spec.js`   | Page-number shortcut, modifier safety, focus ring on every link, no keyboard trap                                                             |
| `tests/e2e/nojs.spec.js`       | The whole site with scripting disabled                                                                                                        |
| `tests/e2e/a11y.spec.js`       | Zero axe violations on all six pages — this is what enforces the palette's contrast rules                                                     |
| `tests/e2e/security.spec.js`   | CSP intact, no inline script/style/handlers, no third-party requests, `rel` on external links                                                 |
| `tests/e2e/layout.spec.js`     | The 40-column grid actually fits at 320/390/768/1440px, nothing overflows the screen, the fastext bar stays on one row — runs on every engine |
| `tests/e2e/visual.spec.js`     | Pixel baselines at 320/390/768/1440px, clock frozen so a diff means something                                                                 |

Visual baselines are Chromium-only on purpose: comparing font rasterisation
across three engines produces noise, not signal.

They are also **macOS-only**, because Playwright suffixes baselines with the
platform and text rasterises differently on Linux. Off macOS these tests skip
loudly rather than pass against a missing baseline, so a Linux CI runner
currently reports them as skipped. The platform-independent half of the
coverage — `layout.spec.js` — runs everywhere. To enable pixel comparison in
CI, generate Linux baselines once inside the official Playwright container
(the command is in the header of `visual.spec.js`) and commit them.

To refresh baselines after an intentional design change:

```sh
npx playwright test visual --update-snapshots
```

## Colour and contrast

The palette is the unmodified teletext eight. Two deliberate exceptions, both
enforced by the accessibility gate:

- Pure blue `#00f` on black is 2.4:1 and fails WCAG AA. It is used for
  decoration only; readable blue text uses `--tt-blue-text: #6a7cff`.
- Red `#f00` (5.25:1) passes for normal text but is reserved for headings and
  accents anyway.

## Security

See [SECURITY.md](SECURITY.md). Short version: a strict CSP ships in the page,
but `frame-ancestors`, `Referrer-Policy`, `X-Content-Type-Options` and HSTS
need real HTTP headers and **no host is configured yet** — there is a deploy
checklist waiting in that file.

## Layout

```
index.html              all content, six <section> pages
assets/css/teletext.css
assets/js/core.js       pure logic, unit tested in Node
assets/js/teletext.js   DOM wiring only
tests/unit/             node:test
tests/e2e/              Playwright
```

## Dependency posture

`npm audit --audit-level=high` gates CI and currently passes.

`@lhci/cli` (Lighthouse CI) was evaluated and **removed**: it contributed five
high-severity advisories whose only npm-offered "fix" was a downgrade to
0.1.0, and it pulled in Puppeteer and a second browser download. For a page
made of four static files with no third-party requests, a Lighthouse
performance score is a foregone conclusion — so the budget it was protecting
is now enforced directly by `tests/e2e/budget.spec.js`, which fails the build
if the page grows past 60KB or 8 requests, or fetches a file that is not on
the allowlist. That catches the thing that actually rots (someone adds a web
font) without the supply-chain cost.

Two moderate advisories remain, both transitive through `linkinator`, the
dev-only link checker. They are below the gate and Dependabot will bump them.

To run Lighthouse ad hoc without committing it as a dependency:

```sh
npm run serve
npx lighthouse http://127.0.0.1:4173/ --view
```
