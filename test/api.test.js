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
const pot = { title: "Dinner", date: "2026-12-01", items: [{ n: "Pies", q: 2 }] };
const G1 = "a".repeat(24), G2 = "b".repeat(24);

test("create, read, claim, cap, host-only actions", async () => {
  assert.equal((await call("POST", "/api/links", { type: "nope", data: pot })).status, 400);
  const { status, j: made } = await call("POST", "/api/links", { type: "potluck", data: pot });
  assert.equal(status, 201);
  const q = "?slug=" + made.slug;

  const { j: got } = await call("GET", "/api/links" + q);
  assert.equal(got.link.type, "potluck");
  assert.equal(got.link.hostHash, undefined);
  assert.equal(got.isHost, false);
  const k = got.link.data.items[0].k;

  assert.equal((await call("POST", "/api/responses" + q, { id: G1, name: "A", items: { [k]: 1 } })).status, 200);
  const over = await call("POST", "/api/responses" + q, { id: G2, name: "B", items: { [k]: 5 } });
  assert.equal(over.status, 409);
  assert.equal(over.j.responses[G2].items[k], 1);
  assert.ok(!(G1 in over.j.responses), "other guest ids are masked");

  assert.equal((await call("PUT", "/api/links" + q, { data: pot }, { "x-host-key": "wrong" })).status, 403);
  const edited = { ...pot, title: "Dinner 2", items: [{ k, n: "Pies", q: 3 }] };
  assert.equal((await call("PUT", "/api/links" + q, { data: edited }, { "x-host-key": made.hostKey })).status, 200);
  const { j: after } = await call("GET", "/api/links" + q, null, { "x-host-key": made.hostKey });
  assert.equal(after.isHost, true);
  assert.equal(after.link.data.items[0].k, k, "item keys survive edits");
  assert.ok(G1 in after.responses);

  assert.equal((await call("DELETE", `/api/responses${q}&id=${G1}`)).status, 403);
  assert.equal((await call("DELETE", "/api/links" + q, null, { "x-host-key": made.hostKey })).status, 200);
  assert.equal((await call("GET", "/api/links" + q)).status, 404);
});
