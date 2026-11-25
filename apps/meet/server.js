// When works: the host picks days (and optionally an hour window). Guests mark when they're free.
//
// data  { title, days: ["YYYY-MM-DD", ...], hours: null | { "YYYY-MM-DD": [from, to] } }
//       hours null means whole days. Otherwise each day has its own window, slots from..to-1.
// row   { name, yes: [slot, ...], at }   slot is "YYYY-MM-DD" or "YYYY-MM-DDTHH"
// Times are wall-clock for the plan. No time zone conversion.
import { str } from "../../core/util.js";

const MAX_DAYS = 62;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const hh = (h) => String(h).padStart(2, "0");

export function slotsOf(data) {
  if (!data.hours) return data.days.slice();
  const out = [];
  for (const d of data.days) { const [f, t] = data.hours[d]; for (let h = f; h < t; h++) out.push(`${d}T${hh(h)}`); }
  return out;
}

export default {
  type: "meet",

  clean(input) {
    const e = {};
    e.title = str(input.title, 80);
    const days = [...new Set((Array.isArray(input.days) ? input.days : []).map(String))]
      .filter((d) => DAY_RE.test(d) && !isNaN(Date.parse(d)))
      .sort();
    if (!days.length) return [null, "Pick at least one day."];
    if (days.length > MAX_DAYS) return [null, `Pick ${MAX_DAYS} days or fewer.`];
    e.days = days;
    e.hours = null;
    if (input.hours && typeof input.hours === "object") {
      e.hours = {};
      for (const d of days) {
        const w = input.hours[d];
        const [f, t] = Array.isArray(w) ? w : [];
        if (!Number.isInteger(f) || !Number.isInteger(t) || f < 0 || t > 24 || f >= t) return [null, "Each day's end time has to be after its start."];
        e.hours[d] = [f, t];
      }
    }
    return [e, null];
  },

  eventDate: (data) => data.days[data.days.length - 1],

  respond(data, id, input, all, ctx = {}) {
    const name = str(input.name, 40) || (ctx.host ? "Host" : "");
    if (!name) return { error: "Add your name first." };
    const valid = new Set(slotsOf(data));
    const yes = [...new Set(Array.isArray(input.yes) ? input.yes.map(String) : [])].filter((s) => valid.has(s));
    return { row: yes.length ? { name, yes, at: Date.now() } : null };
  },

  view: (r) => ({ name: r.name, yes: r.yes || [] }),
};
