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
const G1 = "a".repeat(24), G2 = "b".repeat(24);

test("whole days: create, mark, invalid days dropped", async () => {
  assert.equal((await call("POST", "/api/links", { type: "meet", data: { days: [] } })).status, 400);
  const { status, j: made } = await call("POST", "/api/links", { type: "meet", data: { title: "Dinner", days: ["2026-12-06", "2026-12-05", "2026-12-05", "nope"] } });
  assert.equal(status, 201);
  const q = "?slug=" + made.slug;
  const { j: got } = await call("GET", "/api/links" + q);
  assert.deepEqual(got.link.data.days, ["2026-12-05", "2026-12-06"]);
  assert.equal(got.link.data.from, null);

  assert.equal((await call("POST", "/api/responses" + q, { id: G1, yes: ["2026-12-05"] })).status, 400, "name required");
  const r = await call("POST", "/api/responses" + q, { id: G1, name: "Ana", yes: ["2026-12-05", "2026-12-07"] });
  assert.deepEqual(r.j.responses[G1].yes, ["2026-12-05"]);
  const none = await call("POST", "/api/responses" + q, { id: G1, name: "Ana", yes: [] });
  assert.ok(!(G1 in none.j.responses), "empty clears the row");
});

test("hour window: slots and validation", async () => {
  assert.equal((await call("POST", "/api/links", { type: "meet", data: { days: ["2026-12-05"], from: 20, to: 18 } })).status, 400);
  const { j: made } = await call("POST", "/api/links", { type: "meet", data: { days: ["2026-12-05"], from: 18, to: 21 } });
  const q = "?slug=" + made.slug;
  const r = await call("POST", "/api/responses" + q, { id: G2, name: "Bo", yes: ["2026-12-05T18", "2026-12-05T20", "2026-12-05T21", "2026-12-05"] });
  assert.deepEqual(r.j.responses[G2].yes, ["2026-12-05T18", "2026-12-05T20"]);
  const host = await call("POST", "/api/responses" + q, { id: G1, yes: ["2026-12-05T19"] }, { "x-host-key": made.hostKey });
  assert.equal(host.j.responses[G1].name, "Host");
});
