# Security

A static, unauthenticated page with no runtime dependencies and no third-party
origins. The realistic risks are supply chain (dev tooling and CI), content
injected through a careless edit, and the HTTP headers the host does or does
not send.

## What the site enforces itself

- **Strict CSP** shipped as a `<meta http-equiv>` in `index.html`:
  `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self';
font-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'`.
  This is only achievable because there is no inline script or style and no
  CDN. `tests/e2e/security.spec.js` fails the build if that stops being true.
- **No third-party requests.** No fonts, analytics, or CDN. Asserted in tests
  by watching every network request the page makes.
- `rel="noopener noreferrer"` on every external link, also asserted in tests.

## What the site cannot enforce — deploy checklist

These **cannot** be set from a meta tag. They need real HTTP response headers
from whichever host is chosen, and until then clickjacking protection in
particular is absent:

| Header                      | Value                                                          |
| --------------------------- | -------------------------------------------------------------- |
| `Content-Security-Policy`   | same policy as the meta tag, plus `frame-ancestors 'none'`     |
| `X-Frame-Options`           | `DENY`                                                         |
| `X-Content-Type-Options`    | `nosniff`                                                      |
| `Referrer-Policy`           | `no-referrer`                                                  |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=(), interest-cohort=()` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload`                 |

No host has been configured yet, so none of the above is applied. Apply them
in the same change that sets up hosting.

## Pipeline

- `npm audit --audit-level=high` gates CI; `package-lock.json` is committed.
  Dev dependencies are kept deliberately small — `@lhci/cli` was dropped
  rather than carry five unfixable high-severity advisories for a metric a
  four-file static page passes by construction (see README).
- Dependabot watches npm and GitHub Actions.
- CodeQL runs on pull requests and weekly.
- Gitleaks scans every pull request for committed secrets.
- Workflows pin actions to full commit SHAs, default to
  `permissions: contents: read`, and never use `pull_request_target`.

## Reporting

Open a private security advisory on the repository, or email
`juuso.issakainen@nitor.com`.
