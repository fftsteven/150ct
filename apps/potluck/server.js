// Potluck: menu, items with quantities guests claim, extras.
import { str, rand } from "../../core/util.js";

const THEMES = ["thanksgiving", "bbq", "birthday", "holiday", "party"];

export default {
  type: "potluck",

  // Returns [data, error]. prev is the existing data on edit, so item keys survive and claims stay attached.
  clean(input, prev) {
    const e = {};
    e.title = str(input.title, 80);
    if (!e.title) return [null, "Give it a title."];
    e.date = str(input.date, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date) || isNaN(Date.parse(e.date))) return [null, "Pick a date."];
    e.time = /^\d{2}:\d{2}$/.test(input.time || "") ? input.time : "";
    e.place = str(input.place, 80);
    e.address = str(input.address, 160);
    e.notes = str(input.notes, 600);
    e.contact = str(input.contact, 40);
    e.theme = THEMES.includes(input.theme) ? input.theme : "party";
    e.menu = (Array.isArray(input.menu) ? input.menu : []).map((m) => str(m, 40)).filter(Boolean).slice(0, 30);
    const prevKeys = new Set((prev?.items || []).map((i) => i.k));
    const seen = new Set();
    e.items = (Array.isArray(input.items) ? input.items : []).map((it) => {
      const n = str(it?.n, 60);
      const q = Math.max(1, Math.min(50, Math.floor(+it?.q || 1)));
      const k = typeof it?.k === "string" && prevKeys.has(it.k) && !seen.has(it.k) ? it.k : "i" + rand(6);
      seen.add(k);
      return n ? { k, n, q } : null;
    }).filter(Boolean).slice(0, 30);
    if (!e.items.length && !e.menu.length) return [null, "Add at least one thing people can bring."];
    return [e, null];
  },

  eventDate: (data) => data.date,

  // A guest saves their picks. Server enforces quantities.
  // Returns { row } (null row deletes) and optionally { conflict: message } when picks were trimmed.
  respond(data, id, input, all) {
    const name = str(input.name, 60);
    if (!name) return { error: "Add your name first." };
    const extras = (Array.isArray(input.extras) ? input.extras : []).map((x) => str(x, 140)).filter(Boolean).slice(0, 20);
    const items = {};
    let trimmed = false;
    for (const { k, q } of data.items) {
      const want = Math.max(0, Math.floor(+((input.items || {})[k]) || 0));
      if (!want) continue;
      const taken = Object.entries(all).filter(([cid]) => cid !== id).reduce((t, [, r]) => t + (+(r.items || {})[k] || 0), 0);
      const n = Math.min(want, Math.max(0, q - taken));
      if (n < want) trimmed = true;
      if (n) items[k] = n;
    }
    const row = Object.keys(items).length || extras.length ? { name, items, extras, at: Date.now() } : null;
    return { row, conflict: trimmed ? "Someone just grabbed one of those. Updated the list." : null };
  },

  // Strip anything guests shouldn't see about each other.
  view: (r) => ({ name: r.name, items: r.items || {}, extras: r.extras || [] }),
};
