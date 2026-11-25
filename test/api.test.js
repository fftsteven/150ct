import { test } from "node:test";
import assert from "node:assert/strict";
import { mockRedis } from "./mock-redis.js";

globalThis.__MOCK_REDIS = mockRedis();
const { handle } = await import("../core/handler.js");

const call = async (method, path, body, headers = {}) => {
  const r = await handle(new Request("http://x" + path, {
    method, headers: { "content-type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  }));
  return { status: r.status, j: await r.json() };
};
const pot = { title: "Dinner", date: "2026-12-01", icon: "turkey", dishes: [{ n: "Pie" }, { n: "Rolls" }] };
const G1 = "a".repeat(24), G2 = "b".repeat(24);

test("create, read, claim, conflict, host-only actions", async () => {
  assert.equal((await call("POST", "/api/links", { type: "nope", data: pot })).status, 400);
  const { status, j: made } = await call("POST", "/api/links", { type: "potluck", data: pot });
  assert.equal(status, 201);
  const q = "?slug=" + made.slug;

  const { j: got } = await call("GET", "/api/links" + q);
  assert.equal(got.link.type, "potluck");
  assert.equal(got.link.hostHash, undefined);
  assert.equal(got.isHost, false);
  assert.equal(got.link.data.icon, "turkey");
  const [k, k2] = got.link.data.dishes.map((d) => d.k);

  assert.equal((await call("POST", "/api/responses" + q, { id: G1, name: "A", take: [k] })).status, 200);
  const clash = await call("POST", "/api/responses" + q, { id: G2, name: "B", take: [k, k2], add: ["Wine"] });
  assert.equal(clash.status, 409);
  assert.deepEqual(clash.j.responses[G2].take, [k2]);
  assert.deepEqual(clash.j.responses[G2].add, ["Wine"]);
  assert.ok(!(G1 in clash.j.responses), "other guest ids are masked");
  assert.equal((await call("POST", "/api/responses" + q, { id: G2, take: [k2] })).status, 400, "name required");

  const H = "c".repeat(24);
  const hostResp = await call("POST", "/api/responses" + q, { id: H, name: "Me", add: ["Turkey"] }, { "x-host-key": made.hostKey });
  assert.equal(hostResp.j.responses[H].name, "Host");

  assert.equal((await call("PUT", "/api/links" + q, { data: pot }, { "x-host-key": "wrong" })).status, 403);
  const edited = { ...pot, title: "Dinner 2", dishes: [{ k, n: "Apple pie" }, { n: "Salad" }] };
  assert.equal((await call("PUT", "/api/links" + q, { data: edited }, { "x-host-key": made.hostKey })).status, 200);
  const { j: after } = await call("GET", "/api/links" + q, null, { "x-host-key": made.hostKey });
  assert.equal(after.isHost, true);
  assert.equal(after.link.data.dishes[0].k, k, "dish keys survive edits");
  assert.ok(G1 in after.responses);

  assert.equal((await call("DELETE", `/api/responses${q}&id=${G1}`)).status, 403);
  assert.equal((await call("DELETE", "/api/links" + q, null, { "x-host-key": made.hostKey })).status, 200);
  assert.equal((await call("GET", "/api/links" + q)).status, 404);
});

test("icon accepts the set or an emoji, nothing else", async () => {
  const mk = async (icon) => (await call("GET", "/api/links?slug=" + (await call("POST", "/api/links", { type: "potluck", data: { ...pot, icon } })).j.slug)).j.link.data.icon;
  assert.equal(await mk("fireworks"), "fireworks");
  assert.equal(await mk("🎄"), "🎄");
  assert.equal(await mk("<b>x</b>"), "smiley");
  assert.equal(await mk("hello"), "smiley");
});
