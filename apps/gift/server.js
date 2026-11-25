// Gift exchange: the host types names, the draw happens on create, nobody (host included) sees the pairs.
// Each guest taps their own name once; that locks it to their browser and shows them who they're buying for.
//
// data  { title, budget, date, people: [{ k, n }], pairs: { giverK: receiverK }, avoid: [[k, k]] }
// row   { k, wish, at }   k is the name this browser claimed; wish is shown to their Santa only.
//
// pairs and avoid never leave the server. Responder ids are never shown, not even to the host,
// because GET ?me=<id> reveals that person's match. The host resets a name by its key instead.
import { str, rand } from "../../core/util.js";

const MIN = 3, MAX = 60;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

const shuffle = (a) => {
  const r = crypto.getRandomValues(new Uint32Array(a.length));
  for (let i = a.length - 1; i > 0; i--) { const j = r[i] % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

// Random giver -> receiver map. No one draws themselves or someone they're kept apart from.
// Tries first to avoid two people drawing each other (A gets B, B gets A), then allows it.
export function draw(keys, avoid = []) {
  const no = new Set(avoid.flatMap(([a, b]) => [a + ">" + b, b + ">" + a]));
  const ok = (g, r) => g !== r && !no.has(g + ">" + r);
  for (const noMutual of keys.length >= 4 ? [true, false] : [false]) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const givers = shuffle(keys.slice()), used = new Set(), out = {};
      let steps = 0;
      const go = (i) => {
        if (i === givers.length) return true;
        if (++steps > 20000) return false;
        const g = givers[i];
        for (const r of shuffle(keys.filter((r) => !used.has(r) && ok(g, r)))) {
          if (noMutual && out[r] === g) continue;
          used.add(r); out[g] = r;
          if (go(i + 1)) return true;
          used.delete(r); delete out[g];
        }
        return false;
      };
      if (go(0)) return out;
      if (steps <= 20000) break; // exhausted: no draw exists under these rules
    }
  }
  return null;
}

function cleanDetails(input) {
  const e = {};
  e.title = str(input.title, 80) || "Gift exchange";
  e.budget = str(input.budget, 30);
  const d = str(input.date, 10);
  e.date = DAY_RE.test(d) && !isNaN(Date.parse(d)) ? d : "";
  return e;
}

export default {
  type: "gift",
  private: true,

  // On edit only the details change. Names and the draw are fixed once made.
  clean(input, prev) {
    const e = cleanDetails(input);
    if (prev) return [{ ...prev, ...e }, null];
    const names = (Array.isArray(input.people) ? input.people : []).map((n) => str(n, 40)).filter(Boolean);
    if (names.length < MIN) return [null, `Add at least ${MIN} names.`];
    if (names.length > MAX) return [null, `${MAX} names at most.`];
    const lower = names.map((n) => n.toLowerCase());
    const dup = names.find((n, i) => lower.indexOf(n.toLowerCase()) !== i);
    if (dup) return [null, `${dup} is on the list twice. Add a last initial so people can tell them apart.`];
    const keys = new Set();
    e.people = names.map((n) => { let k; do k = "p" + rand(5); while (keys.has(k)); keys.add(k); return { k, n }; });
    const pairKey = new Set();
    e.avoid = (Array.isArray(input.avoid) ? input.avoid : []).map((p) => {
      const [a, b] = Array.isArray(p) ? p.map(Number) : [];
      if (!Number.isInteger(a) || !Number.isInteger(b) || a === b || !e.people[a] || !e.people[b]) return null;
      const id = [Math.min(a, b), Math.max(a, b)].join();
      if (pairKey.has(id)) return null;
      pairKey.add(id);
      return [e.people[a].k, e.people[b].k];
    }).filter(Boolean).slice(0, 100);
    e.pairs = draw(e.people.map((p) => p.k), e.avoid);
    if (!e.pairs) return [null, "Can't draw names with those pairs kept apart. Remove one and try again."];
    return [e, null];
  },

  // No date: keep it around about two months.
  eventDate: (data) => data.date || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),

  // Claim a name (once per browser), or update your wishlist line.
  respond(data, id, input, all) {
    const k = String(input.k || "");
    if (!data.people.some((p) => p.k === k)) return { error: "Tap your name." };
    const mine = all[id];
    if (mine && mine.k !== k) return { error: "This phone already picked a name." };
    if (!mine && Object.values(all).some((r) => r.k === k)) return { error: "Someone already picked that name. If it's you, ask the host to reset it." };
    return { row: { k, wish: str(input.wish ?? mine?.wish, 120), at: mine?.at || Date.now() } };
  },

  // Everyone sees which names are taken, nothing else.
  view: (r) => ({ k: r.k }),

  // What the page gets as link.data. me is this browser's responder id.
  publicData(data, { me, all }) {
    const { pairs, avoid, ...pub } = data;
    const row = me && all[me];
    if (row && pairs[row.k]) {
      const to = pairs[row.k];
      const toRow = Object.values(all).find((r) => r.k === to);
      pub.mine = {
        k: row.k,
        wish: row.wish || "",
        to: data.people.find((p) => p.k === to)?.n || "",
        toWish: toRow?.wish || "",
      };
    }
    return pub;
  },

  // Host resets a name by its key.
  responderFor(all, k) {
    return Object.keys(all).find((id) => all[id].k === k) || "";
  },
};
