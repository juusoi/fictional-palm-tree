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
npm run links      # external link check (LinkedIn blocks bots; the canonical
                   # URL is skipped until the domain is live — see Hosting)
npm run lint:actions  # actionlint over .github/workflows (needs the actionlint binary)
```

| Suite                           | What it protects                                                                                                                              |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/unit/core.test.js`       | The keypad state machine, route resolution and clock formatting — the only real logic in the codebase                                         |
| `tests/unit/site-files.test.js` | CNAME is one bare hostname, the canonical URL still matches it, robots.txt allows crawling                                                    |
| `tests/e2e/navigation.spec.js`  | Deep links, fastext bar, back/forward, unknown-hash fallback                                                                                  |
| `tests/e2e/keyboard.spec.js`    | Page-number shortcut, modifier safety, focus ring on every link, no keyboard trap                                                             |
| `tests/e2e/nojs.spec.js`        | The whole site with scripting disabled                                                                                                        |
| `tests/e2e/a11y.spec.js`        | Zero axe violations on all six pages — this is what enforces the palette's contrast rules                                                     |
| `tests/e2e/security.spec.js`    | CSP intact, no inline script/style/handlers, no third-party requests, `rel` on external links                                                 |
| `tests/e2e/layout.spec.js`      | The 40-column grid actually fits at 320/390/768/1440px, nothing overflows the screen, the fastext bar stays on one row — runs on every engine |
| `tests/e2e/budget.spec.js`      | Page weight under 60KB and 8 requests, and nothing fetched outside the allowlist                                                              |
| `tests/e2e/visual.spec.js`      | Pixel baselines at 320/390/768/1440px, clock frozen so a diff means something                                                                 |

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

## Continuous integration

`.github/workflows/ci.yml` runs on every push to `main`, every pull request,
and on demand. Five jobs, all blocking:

| Job                     | What it runs                                                                                                                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Lint, unit tests, audit | `eslint`, `stylelint`, `html-validate`, `prettier --check`, `node:test`, `npm audit --audit-level=high`                             |
| End-to-end              | Playwright across chromium, firefox, webkit, mobile and a JavaScript-disabled project                                               |
| Workflow lint           | `actionlint` — catches bad expressions, unknown contexts and shellcheck findings inside `run:` blocks, which YAML validity does not |
| Link check              | `linkinator`, so a dead external link fails the build                                                                               |
| Secret scan             | `gitleaks` over the full history                                                                                                    |

`.github/workflows/codeql.yml` runs CodeQL on pull requests and weekly.
`.github/workflows/pages.yml` re-verifies and deploys on push to `main`.

Every action is pinned to a full commit SHA (the actionlint container to an
image digest), workflows default to `permissions: contents: read`, and none
uses `pull_request_target`.

## Colour and contrast

The palette is the unmodified teletext eight. Two deliberate exceptions, both
enforced by the accessibility gate:

- Pure blue `#00f` on black is 2.4:1 and fails WCAG AA. It is used for
  decoration only; readable blue text uses `--tt-blue-text: #6a7cff`.
- Red `#f00` (5.25:1) passes for normal text but is reserved for headings and
  accents anyway.

## Hosting

Deployed to GitHub Pages by `.github/workflows/pages.yml` on every push to
`main`. The workflow runs lint, unit tests and a Chromium + no-JS end-to-end
pass before it deploys, so a red test never reaches the live site.

It publishes an **allowlist**, not the checkout — `index.html`, `robots.txt`,
`assets/` and `CNAME` are copied into `_site/`. Tests, workflows and configs
stay off the public site.

### Custom domain

`CNAME` is committed and contains `juuso.issakainen.fi`. It is whitelisted in
`.gitignore` — it has to be, or the deny-by-default rules would drop it
silently, and a missing `CNAME` file is exactly how a custom domain reverts
without anyone noticing. `tests/unit/site-files.test.js` asserts it holds one
bare hostname and that `index.html`'s canonical URL still points at the same
host.

### One-time setup

1. **Settings → Pages → Build and deployment → Source:** select
   **GitHub Actions**. Nothing deploys until this is set.
2. Add one DNS record at domainhotelli.fi:

   | Type  | Name    | Value               |
   | ----- | ------- | ------------------- |
   | CNAME | `juuso` | `juusoi.github.io.` |

   The target is the **user** domain `juusoi.github.io`, not the project
   path — GitHub routes to the right repository using the `CNAME` file.
   Leave the existing `issakainen.fi` A record alone; this only adds a
   subdomain.

3. **Settings → Pages → Custom domain:** enter `juuso.issakainen.fi` and
   save. GitHub verifies DNS, then issues a Let's Encrypt certificate. This
   can take up to 24 hours, and HTTPS errors until it completes.
4. Once the certificate is issued, tick **Enforce HTTPS**.
5. Then remove `--skip "^https://juuso.issakainen.fi"` from the `links`
   script in `package.json`. It is there only because the canonical URL
   cannot resolve before the domain is live; once it is, the link check
   should be verifying it.

Verify:

```sh
dig +short juuso.issakainen.fi CNAME     # expect juusoi.github.io.
curl -sSI https://juuso.issakainen.fi/ | head -1
```

Asset paths are relative, so the site works both at
`juusoi.github.io/fictional-palm-tree/` and at the custom domain root.

## Security

See [SECURITY.md](SECURITY.md). Short version: a strict CSP and a
`no-referrer` policy ship in the page's markup, but **GitHub Pages cannot
send custom response headers at all** — verified against GitHub's own Pages
site. So `X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors` and
HSTS are unavailable on this host, permanently, not pending.

That was an informed trade for hosting simplicity. Clickjacking is the only
control genuinely lost, and on a static page with no auth, forms or state
there is nothing to hijack — the assessment and its expiry condition are
written down in SECURITY.md.

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

`npm audit --audit-level=high` gates CI. Current state: **0 outdated
packages, 0 advisories** at any severity.

Every GitHub Action is pinned to a full commit SHA and the actionlint
container to an image digest — a tag like `@v4` is mutable and can be
repointed at new code, a SHA cannot. The trade is that pins do not update
themselves, so Dependabot watches the `github-actions` ecosystem and groups
its bumps into a single PR. The actionlint image digest is the one pin
Dependabot does not manage; refresh it by hand when bumping that tool.

Node floor is `^22.22.0 || >=24.8.0`, which is the real intersection of what
the tooling requires (`html-validate` needs `^22.22 || >=24.8`, `linkinator`
needs `>=22`, `eslint` needs `^20.19 || ^22.13 || >=24`). CI runs 24.

`@lhci/cli` (Lighthouse CI) was evaluated and **removed**: it contributed
five high-severity advisories whose only npm-offered "fix" was a downgrade
to 0.1.0, and it pulled in Puppeteer and a second browser download. For a
page made of four static files with no third-party requests, a Lighthouse
performance score is a foregone conclusion — so the budget it was protecting
is now enforced directly by `tests/e2e/budget.spec.js`, which fails the build
if the page grows past 60KB or 8 requests, or fetches a file that is not on
the allowlist. That catches the thing that actually rots (someone adds a web
font) without the supply-chain cost.

`gitleaks-action` is free for personal repositories; organisation use
requires a licence key.

To run Lighthouse ad hoc without committing it as a dependency:

```sh
npm run serve
npx lighthouse http://127.0.0.1:4173/ --view
```
