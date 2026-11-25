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
const eat = { title: "Friday dinner", date: "2026-12-04", near: "Koreatown", places: [{ n: "Sonoratown", note: "cash only", url: "https://maps.app.goo.gl/abc" }, { n: "Loqui", url: "javascript:alert(1)" }, { n: "" }] };
const G1 = "a".repeat(24), G2 = "b".repeat(24);

test("yes votes, guest-added places, pick locks voting", async () => {
  const { status, j: made } = await call("POST", "/api/links", { type: "eat", data: eat });
  assert.equal(status, 201);
  const q = "?slug=" + made.slug, H = { "x-host-key": made.hostKey };
  const { j: got } = await call("GET", "/api/links" + q);
  assert.equal(got.link.data.places.length, 2, "blank place dropped");
  assert.equal(got.link.data.places[0].note, "cash only");
  assert.equal(got.link.data.places[0].url, "https://maps.app.goo.gl/abc");
  assert.equal(got.link.data.places[1].url, undefined, "only Google Maps links kept");
  const [a, b] = got.link.data.places.map((p) => p.k);

  assert.equal((await call("POST", "/api/responses" + q, { id: G1, yes: [a] })).status, 400, "name required");
  let r = await call("POST", "/api/responses" + q, { id: G1, name: "Jess", yes: [a, b, "nope"], add: [{ k: "aqwerty", n: "Holbox" }] });
  assert.equal(r.status, 200);
  assert.deepEqual(r.j.responses[G1].yes, [a, b]);
  r = await call("POST", "/api/responses" + q, { id: G1, name: "Jess", yes: [a, "aqwerty"], add: [{ k: "aqwerty", n: "Holbox" }] });
  assert.deepEqual(r.j.responses[G1].yes, [a, "aqwerty"], "can vote for own added place");

  r = await call("POST", "/api/responses" + q, { id: G2, name: "Mo", yes: ["aqwerty"], add: [{ k: "aqwerty", n: "Steal" }] });
  assert.deepEqual(r.j.responses[G2].yes, ["aqwerty"], "can vote for someone else's place");
  assert.deepEqual(r.j.responses[G2].add, [], "can't reuse someone else's key");

  const edit = { ...got.link.data, pick: { k: "aqwerty", n: "Holbox" } };
  assert.equal((await call("PUT", "/api/links" + q, { data: edit })).status, 403);
  assert.equal((await call("PUT", "/api/links" + q, { data: edit }, H)).status, 200);
  const { j: after } = await call("GET", "/api/links" + q);
  assert.equal(after.link.data.pick.n, "Holbox");
  assert.equal(after.link.data.places[0].k, a, "place keys survive edits");
  assert.equal((await call("POST", "/api/responses" + q, { id: G2, name: "Mo", yes: [a] })).status, 400, "closed after pick");

  assert.equal((await call("PUT", "/api/links" + q, { data: { ...edit, pick: null } }, H)).status, 200);
  assert.equal((await call("POST", "/api/responses" + q, { id: G2, name: "Mo", yes: [a] })).status, 200, "reopened");
});
