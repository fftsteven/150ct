import { test } from "node:test";
import assert from "node:assert/strict";
import { mockRedis } from "./mock-redis.js";

globalThis.__MOCK_REDIS = mockRedis();
const { handle } = await import("../core/handler.js");
const { cleanUrl } = await import("../apps/registry/server.js");

const call = async (method, path, body, headers = {}) => {
  const r = await handle(new Request("http://x" + path, {
    method, headers: { "content-type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  }));
  return { status: r.status, j: await r.json() };
};
const A = "a".repeat(24), B = "b".repeat(24);

test("cleanUrl keeps http(s) only", () => {
  assert.equal(cleanUrl("amazon.com/dp/B0"), "https://amazon.com/dp/B0");
  assert.equal(cleanUrl("javascript:alert(1)"), "");
  assert.equal(cleanUrl("data:text/html,hi"), "");
  assert.equal(cleanUrl("not a link"), "");
  assert.equal(cleanUrl(""), "");
});

test("claim once, others see taken but not who, host sees names", async () => {
  assert.equal((await call("POST", "/api/links", { type: "registry", data: { title: "Shower", items: [] } })).status, 400);
  const { status, j: made } = await call("POST", "/api/links", { type: "registry", data: {
    title: "Maya's shower", items: [{ n: "Stacking rings", url: "https://www.amazon.com/x/dp/B1", price: "$12" }, { n: "Blanket", url: "javascript:alert(1)" }],
  } });
  assert.equal(status, 201);
  const q = "?slug=" + made.slug, hk = { "x-host-key": made.hostKey };
  const host0 = await call("GET", "/api/links" + q, null, hk);
  const [rings, blanket] = host0.j.link.data.items;
  assert.equal(blanket.url, "", "unsafe link dropped");

  assert.equal((await call("POST", "/api/responses" + q, { id: A, take: [rings.k] })).status, 400, "name needed");
  assert.equal((await call("POST", "/api/responses" + q, { id: A, name: "Ana", take: [rings.k] })).status, 200);
  const clash = await call("POST", "/api/responses" + q, { id: B, name: "Bo", take: [rings.k, blanket.k] });
  assert.equal(clash.status, 409);
  assert.equal((await call("POST", "/api/responses" + q, { id: A, name: "Ana", take: [rings.k] }, hk)).status, 400, "host can't claim");

  const guest = await call("GET", "/api/links" + q + "&me=" + B);
  const rows = Object.entries(guest.j.responses);
  assert.deepEqual(guest.j.responses[B], { name: "Bo", take: [blanket.k] });
  const other = rows.find(([id]) => id !== B)[1];
  assert.deepEqual(other, { take: [rings.k] }, "no name or id for other guests");
  assert.ok(!(A in guest.j.responses));

  const host = await call("GET", "/api/links" + q, null, hk);
  assert.equal(host.j.responses[A].name, "Ana");
});

test("surprise hides claims from the host, guests still see taken", async () => {
  const { j: made } = await call("POST", "/api/links", { type: "registry", data: { title: "Wedding", surprise: true, items: [{ n: "Pan" }] } });
  const q = "?slug=" + made.slug, hk = { "x-host-key": made.hostKey };
  const k = (await call("GET", "/api/links" + q)).j.link.data.items[0].k;
  await call("POST", "/api/responses" + q, { id: A, name: "Ana", take: [k] });
  assert.deepEqual((await call("GET", "/api/links" + q, null, hk)).j.responses, {});
  assert.deepEqual(Object.values((await call("GET", "/api/links" + q + "&me=" + B)).j.responses), [{ take: [k] }]);

  // Edit keeps item keys, and turning surprise off shows names.
  assert.equal((await call("PUT", "/api/links" + q, { data: { title: "Wedding", surprise: false, items: [{ k, n: "Pan" }, { n: "Towels" }] } }, hk)).status, 200);
  const host = await call("GET", "/api/links" + q, null, hk);
  assert.equal(host.j.link.data.items[0].k, k);
  assert.equal(host.j.responses[A].name, "Ana");
});
