// One web-standard handler for the whole API: (Request) => Response.
// Vercel calls it from api/*.js; a Cloudflare Worker can call it directly.
//
// GET    /api/links?slug=&me=        link + responses (masked unless host)
// POST   /api/links                  { type, data } -> { slug, hostKey }
// PUT    /api/links?slug=            { data }        host only
// DELETE /api/links?slug=                            host only
// POST   /api/responses?slug=        { id, ...app fields }
// DELETE /api/responses?slug=&id=                    host only (gift: &k=<name key>)
// GET    /api/unfurl?u=<google maps link>  -> { name }
// GET    /api/places?q=|id=&s=             Google Places search (see core/places.js)
//
// Host key travels in the x-host-key header.

import { APPS } from "../apps/index.js";
import { json } from "./util.js";
import { limited } from "./ratelimit.js";
import { unfurl, isMapsUrl } from "./unfurl.js";
import { placesKey, autocomplete, details } from "./places.js";
import {
  loadLink, isHostOf, createLink, updateLink, deleteLink, loadResponses, saveResponse,
  removeResponse, publicLink, maskResponses, RESPONDER_RE,
} from "./links.js";

const GONE = "This link doesn't exist or has expired.";

async function body(request) {
  try { return await request.json(); } catch { return {}; }
}

// Apps marked private (gift) never show responder ids, not even to the host.
function viewResponses(app, all, me, host) {
  const shaped = Object.fromEntries(Object.entries(all).map(([id, r]) => [id, app.view(r)]));
  return maskResponses(shaped, me, host && !app.private);
}

// An app can hide parts of its data or add what only this browser may see (gift: your match).
function viewLink(app, link, all, me, host) {
  const pub = publicLink(link);
  return app.publicData ? { ...pub, data: app.publicData(link.data, { me, all, host }) } : pub;
}

async function links(request, q, hostKey) {
  const slug = q.get("slug") || "";

  if (request.method === "GET") {
    const link = await loadLink(slug);
    const app = link && APPS[link.type];
    if (!app) return json(404, { error: GONE });
    const host = await isHostOf(link, hostKey);
    const all = await loadResponses(slug), me = q.get("me") || "";
    const responses = viewResponses(app, all, me, host);
    return json(200, { link: viewLink(app, link, all, me, host), responses, isHost: host });
  }

  if (request.method === "POST") {
    if (await limited(request, "create", 20)) return json(429, { error: "Too many links from here. Try again in an hour." });
    const b = await body(request);
    const app = APPS[b.type];
    if (!app) return json(400, { error: "Unknown app." });
    const [data, err] = app.clean(b.data || {}, null);
    if (err) return json(400, { error: err });
    const { slug: s, hostKey: key } = await createLink(app.type, data, app.eventDate(data));
    return json(201, { slug: s, hostKey: key, type: app.type });
  }

  if (request.method === "PUT" || request.method === "DELETE") {
    const prev = await loadLink(slug);
    if (!prev) return json(404, { error: GONE });
    if (!(await isHostOf(prev, hostKey))) return json(403, { error: "That host link isn't valid." });
    if (request.method === "DELETE") { await deleteLink(slug); return json(200, { ok: true }); }
    const app = APPS[prev.type];
    const [data, err] = app.clean((await body(request)).data || {}, prev.data);
    if (err) return json(400, { error: err });
    await updateLink(prev, data, app.eventDate(data));
    return json(200, { ok: true });
  }

  return json(405, { error: "Method not allowed" }, { allow: "GET, POST, PUT, DELETE" });
}

async function responses(request, q, hostKey) {
  const slug = q.get("slug") || "";
  const link = await loadLink(slug);
  const app = link && APPS[link.type];
  if (!app) return json(404, { error: GONE });
  const host = await isHostOf(link, hostKey);

  if (request.method === "POST") {
    if (await limited(request, "respond", 300)) return json(429, { error: "Slow down a little and try again." });
    const b = await body(request);
    const id = String(b.id || "");
    if (!RESPONDER_RE.test(id)) return json(400, { error: "Bad id" });
    const all = await loadResponses(slug);
    const out = app.respond(link.data, id, b, all, { host });
    if (out.error) return json(400, { error: out.error });
    await saveResponse(link, id, out.row);
    if (out.row) all[id] = out.row; else delete all[id];
    return json(out.conflict ? 409 : 200, {
      responses: viewResponses(app, all, id, host),
      ...(out.conflict ? { error: out.conflict } : {}),
    });
  }

  if (request.method === "DELETE") {
    if (!host) return json(403, { error: "Not allowed." });
    const id = app.responderFor ? app.responderFor(await loadResponses(slug), q.get("k") || "") : q.get("id") || "";
    if (id) await removeResponse(slug, id);
    return json(200, { ok: true });
  }

  return json(405, { error: "Method not allowed" }, { allow: "POST, DELETE" });
}

async function unfurlRoute(request, q) {
  const u = q.get("u") || "";
  if (!isMapsUrl(u)) return json(400, { error: "That isn't a Google Maps link." });
  if (await limited(request, "unfurl", 120)) return json(429, { error: "Too many links. Type the name instead." });
  try { return json(200, { name: await unfurl(u) }); } catch { return json(200, { name: "" }); }
}

async function placesRoute(request, q) {
  const key = placesKey();
  if (!key) return json(501, { error: "Search isn't set up." });
  if (await limited(request, "places", 600)) return json(429, { error: "Too many searches. Type the name instead." });
  try {
    if (q.get("id")) return json(200, { place: await details(q.get("id"), q.get("s"), key) });
    return json(200, { results: await autocomplete(request, q.get("q"), q.get("s"), key) });
  } catch (e) {
    console.error(e);
    return json(502, { error: "Search isn't working right now. Type the name instead." });
  }
}

export async function handle(request) {
  try {
    const url = new URL(request.url);
    const hostKey = request.headers.get("x-host-key") || "";
    if (url.pathname === "/api/links") return await links(request, url.searchParams, hostKey);
    if (url.pathname === "/api/responses") return await responses(request, url.searchParams, hostKey);
    if (url.pathname === "/api/unfurl") return await unfurlRoute(request, url.searchParams);
    if (url.pathname === "/api/places") return await placesRoute(request, url.searchParams);
    return json(404, { error: "Not found" });
  } catch (e) {
    console.error(e);
    return json(500, { error: "Server error" });
  }
}
