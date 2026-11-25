# 150ct

Small free web apps for getting together. No accounts, no ads, every link deletes itself after the event.

## Layout

```
public/                     static site (Vercel outputDirectory)
  index.html                toy box landing
  shared/shelf.js           shelf tiles, sprites, donate/Discord links  <- edit to launch an app
  shared/app.css            look shared by every app page (each app sets --hero/--acc)
  apps/potluck/             new.html (create/edit), view.html (guest/host), lib.js
  apps/eat/                 Where to eat: same shape, plus style.css for its colours
api/links.js, responses.js  Vercel entries; both just call core/handler.js
core/                       platform: link model, expiry, host keys, rate limits, storage
apps/                       server side of each app (validation, responses)
  index.js                  registry
  potluck/server.js
  eat/server.js
dev.js                      local server, in-memory Redis
scripts/preview.mjs         one-file clickable preview (dist/preview.html)
test/                       node --test
```

## Platform model

Every app is a type of **link**. The platform owns slug, host key, expiry and responses; the app owns its payload.

- `150ct:link:<slug>` JSON `{ v, type, slug, hostHash, plan, owner, createdAt, updatedAt, expiresAt, data }`
- `150ct:resp:<slug>` hash `responderId -> JSON`
- `150ct:rl:<bucket>:<ip hash>:<hour>` rate limits
- Slug: 8 chars, unambiguous alphabet. Host key: 24 chars, stored as SHA-256, sent as `x-host-key`, delivered in the URL hash so it never hits logs.
- Expiry: event date + 30 days (min 7 days, max 400). Policy lives in `core/links.js` `ttlSeconds()`.
- **Plus later:** `plan` (always `"free"`) and `owner` (always `null`) are on every link, expiry is keyed by plan, and `150ct:owner:<id>` is reserved for a dashboard index. Nothing reads them yet.

URLs: `/` landing, `/<type>` create, `/<type>/<slug>` the link. Host link is the same URL with `#host=<key>`.

API (`core/handler.js`):

| | |
|---|---|
| `GET /api/links?slug=&me=` | link + responses (other guests' ids masked unless host) |
| `POST /api/links` `{type, data}` | create, returns `{slug, hostKey}`. 20/hour per IP |
| `PUT /api/links?slug=` `{data}` | edit, host only |
| `DELETE /api/links?slug=` | delete link and responses, host only |
| `POST /api/responses?slug=` `{id, ...}` | save one guest's response. 300/hour per IP |
| `DELETE /api/responses?slug=&id=` | host removes a response |

### Adding an app

1. `apps/<type>/server.js` exporting `type`, `clean`, `eventDate`, `respond`, `view` (see `apps/index.js`), and register it.
2. `public/apps/<type>/new.html` and `view.html`.
3. Two rewrites in `vercel.json`: `/<type>` and `/<type>/:slug`.
4. Flip its tile in `public/shared/shelf.js` to `status: "live"` with `href: "/<type>"`.

## Run

```
npm install
npm run dev        # http://localhost:3000, in-memory Redis
npm test
npm run preview    # dist/preview.html
```

## Portability

Handlers are web-standard `(Request) => Response`, crypto is Web Crypto, Redis is Upstash over HTTP. Nothing is Vercel-specific except `api/*.js` (3 lines each) and the rewrites in `vercel.json`. To move to Cloudflare: a Worker that calls `handle(request)` for `/api/*`, static assets from `public/`, the same rewrites as `_redirects`, and the Upstash env vars.

## Deploy (Vercel)

1. Import the GitHub repo in Vercel. Framework preset: Other. No build command. `vercel.json` sets the output directory.
2. Storage: connect the Upstash database (`upstash-kv-cyan-notebook`). It provides `KV_REST_API_URL` / `KV_REST_API_TOKEN` (`UPSTASH_REDIS_REST_*` also accepted). Redeploy after connecting. Keys are prefixed `150ct:` so the database can be shared with the old potluck.
3. Domains: add `150ct.com` (primary) and `150ct.app` set to redirect to it. In Namecheap Advanced DNS, remove the parking records and add the A / CNAME records Vercel shows.
