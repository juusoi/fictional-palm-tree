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

## Host: GitHub Pages, and what that costs

The site is hosted on GitHub Pages with a custom subdomain. **GitHub Pages
cannot send custom HTTP response headers** — there is no `_headers` file, no
`netlify.toml`, no configuration of any kind for this. Verified empirically
against GitHub's own Pages site on a custom domain:

```console
$ curl -sSI https://pages.github.com/
HTTP/2 200
server: GitHub.com
content-type: text/html; charset=utf-8
access-control-allow-origin: *
...
```

No `Strict-Transport-Security`, no `X-Frame-Options`, no
`X-Content-Type-Options`, no `Referrer-Policy`. This is not a pending task;
on this host it is not achievable. It was a deliberate, informed choice to
accept it in exchange for the simplicity of hosting.

| Control                             | Status on GitHub Pages | Notes                                                                                                                          |
| ----------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| HTTPS, with HTTP redirected         | **Yes**                | Enable "Enforce HTTPS" in Settings → Pages once the certificate is issued                                                      |
| Content-Security-Policy             | **Partly**             | The meta tag carries the full policy except `frame-ancestors`, which is ignored in meta form by specification                  |
| Referrer-Policy                     | **Yes**                | Recovered via `<meta name="referrer" content="no-referrer">`, asserted in `tests/e2e/security.spec.js`                         |
| X-Content-Type-Options              | No                     | Mitigated in practice: Pages serves a correct `Content-Type` for every file type this site uses (html, css, js, svg, txt)      |
| X-Frame-Options / `frame-ancestors` | No                     | See the clickjacking note below                                                                                                |
| Strict-Transport-Security           | No                     | Also rules out the HSTS preload list, which requires the header to be served. `github.io` is preloaded; a custom domain is not |

### Clickjacking: assessed, accepted

The page can be framed by anyone. The honest impact: it is a static
portfolio with no authentication, no session, no forms, no state, and no
action a victim could be tricked into performing. Framing it achieves
nothing beyond displaying it. The risk is accepted rather than mitigated.

A JavaScript frame-buster was considered and rejected: it would be trivially
bypassed, would break legitimate embedding, and would add a moving part to a
page whose whole security argument is that it has none.

If this ever grows a form, a login, or anything a click can trigger, that
assessment stops holding — move to a host that can send headers
(Cloudflare Pages and Netlify both support a `_headers` file) and apply the
full set:

| Header                      | Value                                          |
| --------------------------- | ---------------------------------------------- |
| `Content-Security-Policy`   | the meta policy, plus `frame-ancestors 'none'` |
| `X-Frame-Options`           | `DENY`                                         |
| `X-Content-Type-Options`    | `nosniff`                                      |
| `Referrer-Policy`           | `no-referrer`                                  |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=()`     |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |

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
