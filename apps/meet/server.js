// When works: the host picks days (and optionally an hour window). Guests mark when they're free.
//
// data  { title, days: ["YYYY-MM-DD", ...], from: 0-23 | null, to: 1-24 | null }
//       from/to null means whole days. Otherwise every picked day gets hour slots from..to-1.
// row   { name, yes: [slot, ...], at }   slot is "YYYY-MM-DD" or "YYYY-MM-DDTHH"
// Times are wall-clock for the plan. No time zone conversion.
import { str } from "../../core/util.js";

const MAX_DAYS = 62;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const hh = (h) => String(h).padStart(2, "0");

export function slotsOf(data) {
  if (data.from == null) return data.days.slice();
  const out = [];
  for (const d of data.days) for (let h = data.from; h < data.to; h++) out.push(`${d}T${hh(h)}`);
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
    const from = Number.isInteger(input.from) ? input.from : null;
    const to = Number.isInteger(input.to) ? input.to : null;
    if (from != null || to != null) {
      if (from == null || to == null || from < 0 || to > 24 || from >= to) return [null, "The end time has to be after the start."];
      e.from = from; e.to = to;
    } else { e.from = null; e.to = null; }
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
