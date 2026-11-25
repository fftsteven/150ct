// The shared link model every app sits on.
//
// 150ct:link:<slug>  JSON
//   { v, type, slug, hostHash, plan, owner, createdAt, updatedAt, expiresAt, data }
//   data is the app's own payload (see apps/<type>/server.js).
// 150ct:resp:<slug>  hash: responderId -> JSON (shape defined by the app)
//
// plan/owner are placeholders for a future Plus tier. Everything is "free" today
// and owner is always null. ttlSeconds() is the one place expiry policy lives.

import { redis, K } from "./store.js";
import { parse, rand, sha } from "./util.js";

export const SLUG_RE = /^[a-z0-9]{8}$/;
export const RESPONDER_RE = /^[a-z0-9]{20,40}$/;

const DAY = 86400;
const POLICY = {
  free: { afterEventDays: 30, minDays: 7, maxDays: 400 },
  // plus: { afterEventDays: 365, minDays: 7, maxDays: null }, // later
};

// Expire `afterEventDays` after the event; never sooner than minDays from now, never later than maxDays.
export function ttlSeconds(eventDate, plan = "free") {
  const p = POLICY[plan] || POLICY.free;
  const end = Date.parse(String(eventDate) + "T23:59:59Z") + p.afterEventDays * DAY * 1000;
  const s = Math.round((end - Date.now()) / 1000) || 0;
  return Math.min(p.maxDays * DAY, Math.max(p.minDays * DAY, s));
}

export async function loadLink(slug) {
  if (!SLUG_RE.test(slug || "")) return null;
  return parse(await redis().get(K.link(slug)));
}

export async function isHostOf(link, key) {
  return !!link && !!key && (await sha(key)) === link.hostHash;
}

export async function createLink(type, data, eventDate) {
  let slug = rand(8);
  for (let i = 0; i < 3 && (await redis().get(K.link(slug))); i++) slug = rand(8);
  const hostKey = rand(24);
  const ttl = ttlSeconds(eventDate);
  const now = Date.now();
  const link = {
    v: 1, type, slug, hostHash: await sha(hostKey),
    plan: "free", owner: null,
    createdAt: now, updatedAt: now, expiresAt: now + ttl * 1000,
    data,
  };
  await redis().set(K.link(slug), JSON.stringify(link), { ex: ttl });
  return { slug, hostKey, link };
}

export async function updateLink(prev, data, eventDate) {
  const ttl = ttlSeconds(eventDate, prev.plan);
  const now = Date.now();
  const link = { ...prev, data, updatedAt: now, expiresAt: now + ttl * 1000 };
  await redis().set(K.link(prev.slug), JSON.stringify(link), { ex: ttl });
  await redis().expire(K.resp(prev.slug), ttl);
  return link;
}

export async function deleteLink(slug) {
  await redis().del(K.link(slug), K.resp(slug));
}

export async function loadResponses(slug) {
  const raw = (await redis().hgetall(K.resp(slug))) || {};
  const out = {};
  for (const [id, v] of Object.entries(raw)) { const r = parse(v); if (r) out[id] = r; }
  return out;
}

export async function saveResponse(link, id, row) {
  if (row == null) return redis().hdel(K.resp(link.slug), id);
  await redis().hset(K.resp(link.slug), { [id]: JSON.stringify(row) });
  await redis().expire(K.resp(link.slug), Math.max(60, Math.round((link.expiresAt - Date.now()) / 1000)));
}

export async function removeResponse(slug, id) {
  await redis().hdel(K.resp(slug), id);
}

// What guests get: the link without secrets.
export function publicLink(link) {
  const { hostHash, owner, ...rest } = link;
  return rest;
}

// Other people's responder ids are masked unless you're the host.
export function maskResponses(all, me, isHost) {
  const out = {};
  let i = 0;
  for (const [id, r] of Object.entries(all)) out[isHost || id === me ? id : `g${i++}`] = r;
  return out;
}
