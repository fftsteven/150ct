// Local dev server: `npm run dev` -> http://localhost:3000
// Serves public/ with the rewrites from vercel.json, and the API from core/handler.js.
// Uses an in-memory Redis unless KV_REST_API_URL / UPSTASH_REDIS_REST_URL is set.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

if (!process.env.KV_REST_API_URL && !process.env.UPSTASH_REDIS_REST_URL) {
  const { mockRedis } = await import("./test/mock-redis.js");
  globalThis.__MOCK_REDIS = mockRedis();
  console.log("Using in-memory Redis");
}
const { handle } = await import("./core/handler.js");
const { page } = await import("./core/page.js");

const cfg = JSON.parse(await readFile("vercel.json", "utf8"));
const rules = cfg.rewrites.map((r) => ({
  re: new RegExp("^" + r.source.replace(/:([a-z]+)/gi, "(?<$1>[^/]+)") + "/?$"),
  to: r.destination,
}));
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".png": "image/png", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json" };
const ROOT = join(process.cwd(), cfg.outputDirectory || "public");

async function serveFile(path) {
  const file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT)) return null;
  for (const f of [file, file + ".html", join(file, "index.html")]) {
    try { return { data: await readFile(f), type: types[extname(f)] || "application/octet-stream" }; } catch {}
  }
  return null;
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname.startsWith("/api/")) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const request = new Request(url, {
      method: req.method,
      headers: { ...req.headers, "x-real-ip": req.socket.remoteAddress || "?" },
      body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks),
    });
    const r = await handle(request);
    res.writeHead(r.status, Object.fromEntries(r.headers));
    return res.end(Buffer.from(await r.arrayBuffer()));
  }
  let f = await serveFile(url.pathname);
  const rule = !f && rules.find((r) => r.re.test(url.pathname));
  if (rule) {
    const to = rule.to.replace(/:([a-z]+)/gi, (_, k) => url.pathname.match(rule.re).groups[k]);
    if (to.startsWith("/api/")) {
      const r = await (to.startsWith("/api/page") ? page : handle)(new Request(new URL(to, url), { headers: req.headers }));
      res.writeHead(r.status, Object.fromEntries(r.headers));
      return res.end(Buffer.from(await r.arrayBuffer()));
    }
    f = await serveFile(to);
  }
  if (!f) { res.writeHead(404, { "content-type": "text/plain" }); return res.end("Not found"); }
  res.writeHead(200, { "content-type": f.type });
  res.end(f.data);
}).listen(process.env.PORT || 3000, () => console.log("http://localhost:" + (process.env.PORT || 3000)));
