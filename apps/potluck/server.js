// Potluck: one list of dishes. Each dish is brought by one person. Guests can add their own.
import { str, rand } from "../../core/util.js";

const ICONS = ["turkey", "pie", "pumpkin", "leaf", "tree", "gift", "snowflake", "bell", "champagne", "fireworks",
  "clock", "partyhat", "cake", "balloons", "star", "heart", "smiley", "pizza", "grill", "sun"];
const MAX_DISHES = 40;

// A pixel icon id, or one short emoji the host typed.
function cleanIcon(v) {
  const s = String(v || "").trim();
  if (ICONS.includes(s)) return s;
  if (s && s.length <= 16 && /\p{Extended_Pictographic}/u.test(s) && !/[<>&"'\w\s]/.test(s)) return s;
  return "smiley";
}

// Links made before the redesign used items with quantities.
const dishesOf = (data) => data.dishes || (data.items || []).map((i) => ({ k: i.k, n: i.n }));

export default {
  type: "potluck",

  // Returns [data, error]. prev is the existing data on edit, so dish keys survive and claims stay attached.
  clean(input, prev) {
    const e = {};
    e.title = str(input.title, 80);
    if (!e.title) return [null, "Give it a name."];
    e.date = str(input.date, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date) || isNaN(Date.parse(e.date))) return [null, "Pick a date."];
    e.time = /^\d{2}:\d{2}$/.test(input.time || "") ? input.time : "";
    e.where = str(input.where, 160);
    e.note = str(input.note, 600);
    e.icon = cleanIcon(input.icon);
    const prevKeys = new Set((prev ? dishesOf(prev) : []).map((d) => d.k));
    const seen = new Set();
    e.dishes = (Array.isArray(input.dishes) ? input.dishes : []).map((d) => {
      const n = str(d?.n, 60);
      const k = typeof d?.k === "string" && prevKeys.has(d.k) && !seen.has(d.k) ? d.k : "d" + rand(6);
      seen.add(k);
      return n ? { k, n } : null;
    }).filter(Boolean).slice(0, MAX_DISHES);
    return [e, null];
  },

  eventDate: (data) => data.date,

  // One person's picks: dishes from the list they'll bring, plus dishes they added.
  // A dish goes to whoever claimed it first. Returns { row } (null deletes) and maybe { conflict }.
  respond(data, id, input, all, ctx = {}) {
    const name = ctx.host ? "Host" : str(input.name, 40);
    if (!name) return { error: "Add your name first." };
    const keys = new Set(dishesOf(data).map((d) => d.k));
    const takenByOthers = new Set(Object.entries(all).filter(([cid]) => cid !== id).flatMap(([, r]) => r.take || []));
    const want = [...new Set(Array.isArray(input.take) ? input.take.map(String) : [])].filter((k) => keys.has(k));
    const take = want.filter((k) => !takenByOthers.has(k));
    const add = (Array.isArray(input.add) ? input.add : []).map((x) => str(x, 60)).filter(Boolean).slice(0, 10);
    const row = take.length || add.length ? { name, take, add, at: Date.now() } : null;
    return { row, conflict: take.length < want.length ? "Someone just took that one." : null };
  },

  view: (r) => ({ name: r.name, take: r.take || [], add: r.add || [] }),
};
