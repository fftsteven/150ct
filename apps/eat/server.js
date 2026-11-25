// Where to eat: the host lists a few places, everyone taps yes on the ones that work,
// the leader shows on top. Guests can add a place. The host can lock in the pick.
import { str, rand } from "../../core/util.js";
import { isMapsUrl } from "../../core/unfurl.js";

const MAX_PLACES = 15;
const MAX_ADDS = 3;
const KEY_RE = /^[a-z0-9]{4,12}$/;

const place = (p, k) => {
  const n = str(p?.n, 60);
  if (!n) return null;
  const url = str(p?.url, 300);
  return { k, n, note: str(p?.note, 100), ...(isMapsUrl(url) ? { url } : {}) };
};

// Every key a guest can vote for: the host's places plus places guests added.
const allKeys = (data, all) => new Set([
  ...data.places.map((p) => p.k),
  ...Object.values(all).flatMap((r) => (r.add || []).map((a) => a.k)),
]);

export default {
  type: "eat",

  // Returns [data, error]. Place keys survive edits so votes stay attached.
  clean(input, prev) {
    const e = {};
    e.title = str(input.title, 80);
    if (!e.title) return [null, "Give it a name."];
    e.date = str(input.date, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date) || isNaN(Date.parse(e.date))) return [null, "Pick a date."];
    e.time = /^\d{2}:\d{2}$/.test(input.time || "") ? input.time : "";
    e.near = str(input.near, 80);
    const prevKeys = new Set((prev?.places || []).map((p) => p.k));
    const seen = new Set();
    e.places = (Array.isArray(input.places) ? input.places : []).map((p) => {
      const k = typeof p?.k === "string" && prevKeys.has(p.k) && !seen.has(p.k) ? p.k : "p" + rand(6);
      seen.add(k);
      return place(p, k);
    }).filter(Boolean).slice(0, MAX_PLACES);
    // The host's final call. Can be a guest-added place, so it carries its own name.
    const pk = input.pick && KEY_RE.test(String(input.pick.k || "")) ? place(input.pick, input.pick.k) : null;
    e.pick = pk;
    return [e, null];
  },

  eventDate: (data) => data.date,

  // One person's yeses, plus places they added. Returns { row } (null deletes).
  respond(data, id, input, all, ctx = {}) {
    if (data.pick) return { error: "The host already picked." };
    const name = ctx.host ? "Host" : str(input.name, 40);
    if (!name) return { error: "Add your name first." };
    const taken = allKeys(data, Object.fromEntries(Object.entries(all).filter(([cid]) => cid !== id)));
    const add = [];
    for (const a of Array.isArray(input.add) ? input.add : []) {
      const k = String(a?.k || "");
      if (!KEY_RE.test(k) || taken.has(k) || add.some((x) => x.k === k)) continue;
      const p = place(a, k);
      if (p) add.push(p);
      if (add.length >= MAX_ADDS) break;
    }
    const known = allKeys(data, { ...all, [id]: { add } });
    const yes = [...new Set(Array.isArray(input.yes) ? input.yes.map(String) : [])].filter((k) => known.has(k));
    return { row: yes.length || add.length ? { name, yes, add, at: Date.now() } : null };
  },

  view: (r) => ({ name: r.name, yes: r.yes || [], add: r.add || [] }),
};
