// Squares: a 10x10 football squares grid. Guests tap the squares they want and put their name on them.
// The host locks the grid, which draws 0 to 9 at random for the top and the side, then enters the score
// after each quarter. The last digit of each team's score points to the winning square.
// 150ct never handles money. cost is text shown on the grid, nothing more.
//
// data  { title, top, side, cost, date, locked, cols: [10 digits] | null, rows: [10 digits] | null,
//         scores: [ {a, b} | null ] x4 }   a = top team's score, b = side team's
// row   { cells: { "0".."99": name }, at }   a guest's names are all the same; the host can fill in others'
import { str } from "../../core/util.js";

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DETAILS = ["title", "top", "side", "cost", "date"];

const shuffle = (a) => {
  const r = crypto.getRandomValues(new Uint32Array(a.length));
  for (let i = a.length - 1; i > 0; i--) { const j = r[i] % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const digits = () => shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

function cleanDetails(input) {
  const e = {};
  e.title = str(input.title, 80) || "Football squares";
  e.top = str(input.top, 30);
  e.side = str(input.side, 30);
  e.cost = str(input.cost, 30);
  const d = str(input.date, 10);
  e.date = DAY_RE.test(d) && !isNaN(Date.parse(d)) ? d : "";
  return e;
}

const score = (v) => (Number.isInteger(v) && v >= 0 && v <= 199 ? v : null);
function cleanScore(s) {
  const a = score(s?.a), b = score(s?.b);
  return a == null || b == null ? null : { a, b };
}

// Which square wins for a score, or -1 before the numbers are drawn.
export function winner(data, s) {
  if (!data.locked || !s) return -1;
  return data.rows.indexOf(s.b % 10) * 10 + data.cols.indexOf(s.a % 10);
}

export default {
  type: "squares",

  // Create, edit details, lock (draws the numbers once, for good), or save scores.
  // On edit only the fields sent change, so lock and scores can be sent on their own.
  clean(input, prev) {
    const e = cleanDetails(input);
    if (!prev) return [{ ...e, locked: false, cols: null, rows: null, scores: [null, null, null, null] }, null];
    const out = { ...prev };
    for (const k of DETAILS) if (k in input) out[k] = e[k];
    if (input.lock === true && !prev.locked) Object.assign(out, { locked: true, cols: digits(), rows: digits() });
    if (Array.isArray(input.scores)) {
      if (!out.locked) return [null, "Lock the grid first."];
      out.scores = [0, 1, 2, 3].map((i) => cleanScore(input.scores[i]));
    }
    return [out, null];
  },

  // No date: keep it around about two months.
  eventDate: (data) => data.date || new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),

  // One browser's squares. First tap wins a square. Nothing changes once the grid is locked.
  respond(data, id, input, all, ctx = {}) {
    if (data.locked) return { error: "The grid is locked." };
    const name = str(input.name, 24);
    const raw = input.cells && typeof input.cells === "object" && !Array.isArray(input.cells) ? input.cells : {};
    const others = new Set(Object.entries(all).filter(([rid]) => rid !== id).flatMap(([, r]) => Object.keys(r.cells || {})));
    const cells = {};
    let lost = 0;
    for (const [k, v] of Object.entries(raw).slice(0, 100)) {
      const i = Number(k);
      if (!Number.isInteger(i) || i < 0 || i > 99) continue;
      const n = ctx.host ? str(v, 24) || name : name;
      if (!n) return { error: "Add your name first." };
      if (others.has(String(i))) lost++;
      else cells[i] = n;
    }
    const row = Object.keys(cells).length ? { cells, at: all[id]?.at || Date.now() } : null;
    return { row, conflict: lost ? "Someone just took that square." : null };
  },

  // A squares grid is public to the group: everyone sees every name.
  view: (r) => ({ cells: r.cells || {} }),
};
