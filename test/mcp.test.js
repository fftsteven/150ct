import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { mockRedis } from "./mock-redis.js";

globalThis.__MOCK_REDIS = mockRedis();
const { handle } = await import("../core/handler.js");
const { GRAMS } = await import("../core/mcp.js");

let n = 0;
const rpc = async (method, params, raw) => {
  const r = await handle(new Request("http://x/api/mcp", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify(raw ?? { jsonrpc: "2.0", id: ++n, method, params }),
  }));
  return { status: r.status, j: r.status === 202 ? null : await r.json(), r };
};
const call = async (name, args) => (await rpc("tools/call", { name, arguments: args })).j.result;
const get = async (path) => (await handle(new Request("http://x" + path))).json();
const slugOf = (url) => url.match(/\/([a-z0-9]{8})(#|$)/)[1];

test("handshake and tool list", async () => {
  const { j, r } = await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } });
  assert.equal(j.result.protocolVersion, "2025-06-18");
  assert.equal(j.result.serverInfo.name, "150ct");
  assert.ok(j.result.capabilities.tools);
  assert.equal(r.headers.get("access-control-allow-origin"), "*");
  assert.equal((await rpc(null, null, { jsonrpc: "2.0", method: "notifications/initialized" })).status, 202);
  const tools = (await rpc("tools/list", {})).j.result.tools;
  assert.deepEqual(tools.map((t) => t.name), ["create_potluck", "create_date_poll", "create_gift_exchange", "create_registry", "cups_to_grams"]);
  for (const t of tools) assert.ok(t.title && t.annotations.title === t.title && t.inputSchema.type === "object", t.name);
  assert.equal((await rpc("nope", {})).j.error.code, -32601);
  assert.equal((await handle(new Request("http://x/api/mcp"))).status, 405);
});

test("potluck link works on the real API", async () => {
  const out = await call("create_potluck", { title: "Friendsgiving", date: "2026-12-05", dishes: ["Pie", "Rolls"] });
  assert.ok(!out.isError);
  const { guestLink, hostLink } = out.structuredContent;
  assert.match(guestLink, /^https:\/\/150ct\.com\/potluck\/[a-z0-9]{8}$/);
  assert.ok(hostLink.startsWith(guestLink + "#host="));
  const slug = slugOf(guestLink), key = hostLink.split("#host=")[1];
  const got = await (await handle(new Request("http://x/api/links?slug=" + slug, { headers: { "x-host-key": key } }))).json();
  assert.equal(got.isHost, true);
  assert.deepEqual(got.link.data.dishes.map((d) => d.n), ["Pie", "Rolls"]);
  assert.match((await call("create_potluck", { title: "x" })).content[0].text, /date/i);
});

test("date poll, whole days and hours", async () => {
  const days = await call("create_date_poll", { title: "Dinner", days: ["2026-12-12", "2026-12-10"] });
  const d = (await get("/api/links?slug=" + slugOf(days.structuredContent.guestLink))).link.data;
  assert.deepEqual(d.days, ["2026-12-10", "2026-12-12"]);
  assert.equal(d.hours, null);
  const hrs = await call("create_date_poll", { days: ["2026-12-10"], fromHour: 18, toHour: 22 });
  assert.deepEqual((await get("/api/links?slug=" + slugOf(hrs.structuredContent.guestLink))).link.data.hours, { "2026-12-10": [18, 22] });
  assert.ok((await call("create_date_poll", { days: [] })).isError);
});

test("gift exchange never returns pairs", async () => {
  const out = await call("create_gift_exchange", { names: ["Ana", "Ben", "Cy", "Dee"], budget: "$30", keepApart: [["ana", "Ben"]] });
  assert.ok(!out.isError);
  assert.doesNotMatch(JSON.stringify(out), /pairs|Ana.*buying/);
  const pub = (await get("/api/links?slug=" + slugOf(out.structuredContent.guestLink))).link.data;
  assert.equal(pub.budget, "$30");
  assert.equal(pub.pairs, undefined);
  assert.match((await call("create_gift_exchange", { names: ["A", "B", "C"], keepApart: [["A", "Zed"]] })).content[0].text, /Zed/);
  assert.ok((await call("create_gift_exchange", { names: ["A", "B"] })).isError);
});

test("registry", async () => {
  const out = await call("create_registry", { title: "Shower", items: [{ name: "Stroller", url: "target.com/x", price: "$200" }] });
  const d = (await get("/api/links?slug=" + slugOf(out.structuredContent.guestLink))).link.data;
  assert.equal(d.items[0].url, "https://target.com/x");
  assert.ok((await call("create_registry", { title: "Shower", items: [] })).isError);
});

test("cups to grams matches the To Grams page", async () => {
  const out = await call("cups_to_grams", { ingredient: "flour", amount: 0.5, unit: "cup" });
  assert.equal(out.structuredContent.grams, 60);
  assert.equal((await call("cups_to_grams", { ingredient: "butter", amount: 1, unit: "tsp" })).structuredContent.grams, 4.5);
  assert.ok((await call("cups_to_grams", { ingredient: "gravel", amount: 1, unit: "cup" })).isError);
  const html = await readFile(new URL("../public/apps/grams/new.html", import.meta.url), "utf8");
  const page = [...html.matchAll(/\["(\w+)","([^"]+)",(\d+)\]/g)].map(([, k, nm, g]) => [k, [nm, +g]]);
  assert.deepEqual(Object.fromEntries(page), GRAMS);
});
