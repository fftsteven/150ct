// MCP server: lets ChatGPT, Claude and other AI apps make real 150ct links.
// Streamable HTTP, stateless, JSON responses, no auth (the apps need no login either).
// POST /mcp  (rewritten to /api/mcp)  JSON-RPC 2.0, one message or a batch.
//
// The AI only makes the link. People still claim, vote and draw themselves.
// Each create tool returns a guest link for the group and a host link for the person who asked.

import { APPS } from "../apps/index.js";
import { createLink } from "./links.js";
import { limited } from "./ratelimit.js";

const SITE = "https://150ct.com";
const VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
const INFO = { name: "150ct", title: "150ct", version: "1.0.0", websiteUrl: SITE };
const INSTRUCTIONS =
  "150ct makes free, no sign-up links for getting together: potluck sign-up sheets, group date polls, " +
  "Secret Santa name draws and gift registries. Use only the names, dates and items the user gave; don't invent guests or decide for them. " +
  "Each create tool returns a guest link to send to the group and a host link that only the user should keep (it lets them edit). " +
  "Guests open the link in any browser and make their own choices there.";

// Grams per US cup. Keep in sync with public/apps/grams/new.html (test/mcp.test.js checks).
export const GRAMS = {
  flour: ["Flour", 120], bread: ["Bread flour", 120], wheat: ["Whole wheat flour", 113],
  sugar: ["Sugar", 198], brown: ["Brown sugar", 213], powdered: ["Powdered sugar", 113],
  butter: ["Butter", 227], oil: ["Oil", 218], milk: ["Milk", 244], water: ["Water", 237],
  cream: ["Heavy cream", 238], yogurt: ["Yogurt", 245], honey: ["Honey", 339], maple: ["Maple syrup", 315],
  oats: ["Oats", 89], rice: ["Rice", 185], cocoa: ["Cocoa", 84], chips: ["Chocolate chips", 170],
  pb: ["Peanut butter", 258], cornstarch: ["Cornstarch", 112], salt: ["Salt", 292],
};
const PER_CUP = { cup: 1, tbsp: 1 / 16, tsp: 1 / 48 };

const DATE = { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$", description: "YYYY-MM-DD" };
const CREATE = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true };
const LINK_OUT = {
  type: "object",
  properties: { guestLink: { type: "string" }, hostLink: { type: "string" } },
  required: ["guestLink", "hostLink"],
};

// Each tool maps its arguments to the app's own create payload, so validation stays in apps/<type>/server.js.
const TOOLS = [
  {
    name: "create_potluck",
    title: "Make a potluck sign-up sheet",
    description: "Make a potluck sign-up link. Guests open it and claim the dishes they'll bring, so nothing doubles up. They can add their own dishes too.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", maxLength: 80, description: "Name of the event, like \"Friendsgiving\"" },
        date: DATE,
        time: { type: "string", pattern: "^\\d{2}:\\d{2}$", description: "Start time, 24 hour HH:MM (optional)" },
        where: { type: "string", maxLength: 160, description: "Address or place (optional)" },
        note: { type: "string", maxLength: 600, description: "Note for guests (optional)" },
        dishes: { type: "array", maxItems: 40, items: { type: "string", maxLength: 60 }, description: "Dishes to sign up for (optional). Guests can add more." },
      },
      required: ["title", "date"],
    },
    app: "potluck",
    data: (a) => ({ ...pick(a, "title", "date", "time", "where", "note"), dishes: list(a.dishes).map((n) => ({ n })) }),
  },
  {
    name: "create_date_poll",
    title: "Make a group date poll",
    description: "Make a When works poll. Guests tap the days (or hours) they're free and the best one shows at the top. The group picks; this tool doesn't choose a date.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", maxLength: 80, description: "What it's for (optional)" },
        days: { type: "array", minItems: 1, maxItems: 62, items: DATE, description: "Days to choose from" },
        fromHour: { type: "integer", minimum: 0, maximum: 23, description: "Ask about hours instead of whole days: first hour, 0 to 23 (optional)" },
        toHour: { type: "integer", minimum: 1, maximum: 24, description: "End hour, after fromHour (needed with fromHour)" },
      },
      required: ["days"],
    },
    app: "meet",
    data: (a) => {
      const days = list(a.days);
      const hours = a.fromHour != null || a.toHour != null
        ? Object.fromEntries(days.map((d) => [d, [a.fromHour, a.toHour]])) : null;
      return { title: a.title, days, hours };
    },
  },
  {
    name: "create_gift_exchange",
    title: "Draw names for a gift exchange",
    description: "Make a Secret Santa link. Names are drawn when it's made. Each person taps their own name to see who they're buying for. Nobody else sees the pairs, not even the organizer, and this tool doesn't return them.",
    inputSchema: {
      type: "object",
      properties: {
        names: { type: "array", minItems: 3, maxItems: 60, items: { type: "string", maxLength: 40 }, description: "Everyone in the exchange, each name once" },
        title: { type: "string", maxLength: 80, description: "Name of the exchange (optional)" },
        budget: { type: "string", maxLength: 30, description: "Spending limit, like \"$30\" (optional)" },
        date: { ...DATE, description: "Exchange day, YYYY-MM-DD (optional)" },
        keepApart: {
          type: "array", maxItems: 100,
          items: { type: "array", minItems: 2, maxItems: 2, items: { type: "string" } },
          description: "Pairs of names who shouldn't draw each other, like couples (optional)",
        },
      },
      required: ["names"],
    },
    app: "gift",
    data: (a) => {
      const people = list(a.names);
      const at = (n) => {
        const i = people.findIndex((p) => String(p).trim().toLowerCase() === String(n).trim().toLowerCase());
        if (i < 0) throw new Bad(`${n} isn't in names.`);
        return i;
      };
      return {
        ...pick(a, "title", "budget", "date"), people,
        avoid: list(a.keepApart).map((p) => (Array.isArray(p) ? p.map(at) : [])),
      };
    },
  },
  {
    name: "create_registry",
    title: "Make a gift registry",
    description: "Make a gift list from any store. Guests tap a gift to say they'll get it, so nothing is bought twice. Other guests see it as taken, never who took it.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", maxLength: 80, description: "Like \"Maya's baby shower\"" },
        items: {
          type: "array", minItems: 1, maxItems: 80, description: "The gifts",
          items: {
            type: "object",
            properties: {
              name: { type: "string", maxLength: 80 },
              url: { type: "string", description: "Store link (optional)" },
              price: { type: "string", maxLength: 20, description: "Optional" },
              note: { type: "string", maxLength: 140, description: "Size, color and so on (optional)" },
            },
            required: ["name"],
          },
        },
        date: { ...DATE, description: "Event day, YYYY-MM-DD (optional)" },
        address: { type: "string", maxLength: 200, description: "Where to ship gifts (optional)" },
        note: { type: "string", maxLength: 300, description: "Note for guests (optional)" },
        surprise: { type: "boolean", description: "Hide from the host what's been claimed (optional)" },
      },
      required: ["title", "items"],
    },
    app: "registry",
    data: (a) => ({
      ...pick(a, "title", "date", "address", "note"), surprise: a.surprise === true,
      items: list(a.items).map((i) => ({ n: i?.name, url: i?.url, price: i?.price, note: i?.note })),
    }),
  },
  {
    name: "cups_to_grams",
    title: "Convert cups to grams",
    description: "Convert a US cup or spoon amount of a baking ingredient to grams. Dry goods follow the King Arthur Baking chart, liquids use USDA cup weights.",
    inputSchema: {
      type: "object",
      properties: {
        ingredient: { type: "string", enum: Object.keys(GRAMS), description: Object.entries(GRAMS).map(([k, [n]]) => `${k}: ${n}`).join(", ") },
        amount: { type: "number", exclusiveMinimum: 0, maximum: 1000, description: "How many, like 0.5 or 2" },
        unit: { type: "string", enum: Object.keys(PER_CUP) },
      },
      required: ["ingredient", "amount", "unit"],
    },
    outputSchema: {
      type: "object",
      properties: { ingredient: { type: "string" }, amount: { type: "number" }, unit: { type: "string" }, grams: { type: "number" } },
      required: ["ingredient", "amount", "unit", "grams"],
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    run(a) {
      const ing = GRAMS[a.ingredient], per = PER_CUP[a.unit], amount = Number(a.amount);
      if (!ing) return fail("Unknown ingredient. Use one of: " + Object.keys(GRAMS).join(", "));
      if (!per) return fail("Unit must be cup, tbsp or tsp.");
      if (!(amount > 0 && amount <= 1000)) return fail("Amount must be more than 0.");
      const g = ing[1] * per * amount;
      const grams = g < 10 ? Math.round(g * 2) / 2 : Math.round(g); // same rounding as the page
      const out = { ingredient: ing[0], amount, unit: a.unit, grams };
      return ok(`${amount} ${a.unit} ${ing[0].toLowerCase()} is about ${grams} g. More at ${SITE}/grams`, out);
    },
  },
];

for (const t of TOOLS) if (t.app) { t.annotations = CREATE; t.outputSchema = LINK_OUT; }

class Bad extends Error {}
const pick = (a, ...keys) => Object.fromEntries(keys.filter((k) => a[k] != null).map((k) => [k, a[k]]));
const list = (v) => (Array.isArray(v) ? v : []);
const ok = (text, structuredContent) => ({ content: [{ type: "text", text }], structuredContent });
const fail = (text) => ({ content: [{ type: "text", text }], isError: true });

async function make(tool, args, request) {
  if (await limited(request, "mcp", 300)) return fail("Too many links right now. Try again in an hour.");
  const app = APPS[tool.app];
  let input;
  try { input = tool.data(args); } catch (e) { if (e instanceof Bad) return fail(e.message); throw e; }
  const [data, err] = app.clean(input, null);
  if (err) return fail(err);
  const { slug, hostKey } = await createLink(app.type, data, app.eventDate(data));
  const guestLink = `${SITE}/${app.type}/${slug}`;
  const hostLink = `${guestLink}#host=${hostKey}`;
  return ok(
    `Send this link to the group: ${guestLink}\n` +
    `Host link, keep it private (it lets you edit and manage): ${hostLink}`,
    { guestLink, hostLink },
  );
}

const listed = TOOLS.map(({ name, title, description, inputSchema, outputSchema, annotations }) =>
  ({ name, title, description, inputSchema, outputSchema, annotations }));

const reply = (id, result) => ({ jsonrpc: "2.0", id, result });
const error = (id, code, message) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

async function rpc(msg, request) {
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") return error(msg?.id, -32600, "Invalid request");
  const { id, method, params = {} } = msg;
  if (id === undefined) return null; // notification: nothing to send back

  if (method === "initialize") {
    const v = VERSIONS.includes(params.protocolVersion) ? params.protocolVersion : VERSIONS[0];
    return reply(id, { protocolVersion: v, capabilities: { tools: { listChanged: false } }, serverInfo: INFO, instructions: INSTRUCTIONS });
  }
  if (method === "ping") return reply(id, {});
  if (method === "tools/list") return reply(id, { tools: listed });
  if (method === "tools/call") {
    const tool = TOOLS.find((t) => t.name === params.name);
    if (!tool) return error(id, -32602, "Unknown tool: " + params.name);
    const args = params.arguments && typeof params.arguments === "object" ? params.arguments : {};
    return reply(id, tool.run ? tool.run(args) : await make(tool, args, request));
  }
  return error(id, -32601, "Method not found: " + method);
}

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, GET, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, accept, authorization, mcp-protocol-version, mcp-session-id, last-event-id",
  "access-control-expose-headers": "mcp-session-id, mcp-protocol-version",
};
const send = (status, body, extra = {}) => new Response(body == null ? null : JSON.stringify(body), {
  status, headers: { ...CORS, ...(body == null ? {} : { "content-type": "application/json" }), "cache-control": "no-store", ...extra },
});

export async function mcp(request) {
  if (request.method === "OPTIONS") return send(204, null);
  // Stateless: no server-to-client stream and no sessions to end.
  if (request.method !== "POST") return send(405, error(null, -32000, "Use POST."), { allow: "POST, OPTIONS" });
  let msg;
  try { msg = await request.json(); } catch { return send(400, error(null, -32700, "Parse error")); }
  try {
    if (Array.isArray(msg)) {
      const out = (await Promise.all(msg.map((m) => rpc(m, request)))).filter(Boolean);
      return out.length ? send(200, out) : send(202, null);
    }
    const out = await rpc(msg, request);
    return out ? send(200, out) : send(202, null);
  } catch (e) {
    console.error(e);
    return send(500, error(msg?.id, -32603, "Server error"));
  }
}
