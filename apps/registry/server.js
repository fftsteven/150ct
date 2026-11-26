// Registry: the host lists gifts from any store (name, optional link and price). Guests tap one to say
// they'll get it, so nothing is bought twice. Other guests only see "Taken", never who.
// The host sees who's getting what, unless they turned on surprise, then they see nothing at all.
//
// data  { title, address, date, note, surprise, items: [{ k, n, url, price }] }
// row   { name, take: [k], at }
import { str, rand } from "../../core/util.js";

const MAX_ITEMS = 80;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

// Only plain http(s) links, so a pasted link can't run script when a guest taps it.
export function cleanUrl(v) {
  let s = String(v || "").trim();
  if (!s) return "";
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = "https://" + s;
  try {
    const u = new URL(s);
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".")) return "";
    const out = u.toString();
    return out.length <= 600 ? out : "";
  } catch { return ""; }
}

export default {
  type: "registry",

  // prev is the existing data on edit, so item keys survive and claims stay attached.
  clean(input, prev) {
    const e = {};
    e.title = str(input.title, 80);
    if (!e.title) return [null, "Give it a name."];
    const d = str(input.date, 10);
    e.date = DAY_RE.test(d) && !isNaN(Date.parse(d)) ? d : "";
    e.address = str(input.address, 200);
    e.note = str(input.note, 300);
    e.surprise = input.surprise === true;
    const prevKeys = new Set((prev?.items || []).map((i) => i.k));
    const seen = new Set();
    e.items = (Array.isArray(input.items) ? input.items : []).map((i) => {
      const n = str(i?.n, 80);
      if (!n) return null;
      const k = typeof i?.k === "string" && prevKeys.has(i.k) && !seen.has(i.k) ? i.k : "i" + rand(6);
      seen.add(k);
      return { k, n, url: cleanUrl(i?.url), price: str(i?.price, 20) };
    }).filter(Boolean).slice(0, MAX_ITEMS);
    if (!e.items.length) return [null, "Add at least one gift."];
    return [e, null];
  },

  // No date: keep it around about three months.
  eventDate: (data) => data.date || new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),

  // One guest's picks. An item goes to whoever claimed it first.
  respond(data, id, input, all, ctx = {}) {
    if (ctx.host) return { error: "Hosts can't claim gifts on their own list." };
    const name = str(input.name, 40);
    if (!name) return { error: "Add your name first." };
    const keys = new Set(data.items.map((i) => i.k));
    const takenByOthers = new Set(Object.entries(all).filter(([cid]) => cid !== id).flatMap(([, r]) => r.take || []));
    const want = [...new Set(Array.isArray(input.take) ? input.take.map(String) : [])].filter((k) => keys.has(k));
    const take = want.filter((k) => !takenByOthers.has(k));
    const row = take.length ? { name, take, at: all[id]?.at || Date.now() } : null;
    return { row, conflict: take.length < want.length ? "Someone just took that one." : null };
  },

  // Guests see which items are taken. The host also sees names, unless it's a surprise: then nothing (null drops the row).
  view(r, { host, data, mine } = {}) {
    if (mine) return { name: r.name, take: r.take || [] };
    if (host) return data?.surprise ? null : { name: r.name, take: r.take || [] };
    return { take: r.take || [] };
  },
};
