// One web-standard handler for the whole API: (Request) => Response.
// Vercel calls it from api/*.js; a Cloudflare Worker can call it directly.
//
// GET    /api/links?slug=&me=        link + responses (masked unless host)
// POST   /api/links                  { type, data } -> { slug, hostKey }
// PUT    /api/links?slug=            { data }        host only
// DELETE /api/links?slug=                            host only
// POST   /api/responses?slug=        { id, ...app fields }
// DELETE /api/responses?slug=&id=                    host only
//
// Host key travels in the x-host-key header.

import { APPS } from "../apps/index.js";
import { json } from "./util.js";
import { limited } from "./ratelimit.js";
import {
  loadLink, isHostOf, createLink, updateLink, deleteLink, loadResponses, saveResponse,
  removeResponse, publicLink, maskResponses, RESPONDER_RE,
} from "./links.js";

const GONE = "This link doesn't exist or has expired.";

async function body(request) {
  try { return await request.json(); } catch { return {}; }
}

function viewResponses(app, all, me, host) {
  const shaped = Object.fromEntries(Object.entries(all).map(([id, r]) => [id, app.view(r)]));
  return maskResponses(shaped, me, host);
}

async function links(request, q, hostKey) {
  const slug = q.get("slug") || "";

  if (request.method === "GET") {
    const link = await loadLink(slug);
    const app = link && APPS[link.type];
    if (!app) return json(404, { error: GONE });
    const host = await isHostOf(link, hostKey);
    const responses = viewResponses(app, await loadResponses(slug), q.get("me") || "", host);
    return json(200, { link: publicLink(link), responses, isHost: host });
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
    const out = app.respond(link.data, id, b, all);
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
    await removeResponse(slug, q.get("id") || "");
    return json(200, { ok: true });
  }

  return json(405, { error: "Method not allowed" }, { allow: "POST, DELETE" });
}

export async function handle(request) {
  try {
    const url = new URL(request.url);
    const hostKey = request.headers.get("x-host-key") || "";
    if (url.pathname === "/api/links") return await links(request, url.searchParams, hostKey);
    if (url.pathname === "/api/responses") return await responses(request, url.searchParams, hostKey);
    return json(404, { error: "Not found" });
  } catch (e) {
    console.error(e);
    return json(500, { error: "Server error" });
  }
}
