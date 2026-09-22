/**
 * Static file server for local development and the test run.
 *
 * Why not `python3 -m http.server`: under parallel Playwright workers it
 * intermittently dropped requests, and a dropped module request looks exactly
 * like an application bug — the page still routes (CSS :target) but the
 * script never runs. Flaky infrastructure is worse than no infrastructure.
 *
 * Deliberately serves no security headers: production headers come from the
 * host (see SECURITY.md), and faking them here would give false confidence.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, normalize, resolve, sep } from "node:path";

const ROOT = resolve(process.argv[2] ?? ".");
const PORT = Number(process.env.PORT ?? 4173);
const HOST = "127.0.0.1";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

const server = createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, `http://${HOST}`);
    const decoded = decodeURIComponent(pathname);
    const wanted = decoded.endsWith("/") ? `${decoded}index.html` : decoded;
    const filePath = resolve(ROOT, `.${normalize(wanted)}`);

    if (filePath !== ROOT && !filePath.startsWith(ROOT + sep)) {
      res.writeHead(403, { "content-type": "text/plain" });
      res.end("Forbidden");
      return;
    }

    const body = await readFile(filePath);
    res.writeHead(200, {
      "content-type": TYPES[extname(filePath)] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found");
  }
});

server.listen(PORT, HOST, () => {
  process.stdout.write(`serving ${ROOT} on http://${HOST}:${PORT}\n`);
});
