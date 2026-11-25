import { test } from "node:test";
import assert from "node:assert/strict";
import { mockRedis } from "./mock-redis.js";

globalThis.__MOCK_REDIS = mockRedis();
const { handle } = await import("../core/handler.js");
const { draw } = await import("../apps/gift/server.js");

const call = async (method, path, body, headers = {}) => {
  const r = await handle(new Request("http://x" + path, {
    method, headers: { "content-type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  }));
  return { status: r.status, j: await r.json() };
};
const A = "a".repeat(24), B = "b".repeat(24), C = "c".repeat(24);

test("draw: no self, respects pairs kept apart, fails when impossible", () => {
  for (let i = 0; i < 200; i++) {
    const keys = ["a", "b", "c", "d", "e"];
    const m = draw(keys, [["a", "b"]]);
    assert.deepEqual(Object.keys(m).sort(), keys);
    assert.deepEqual(Object.values(m).sort(), keys);
    for (const [g, r] of Object.entries(m)) { assert.notEqual(g, r); assert.notEqual(m[r], g, "no mutual pairs with 5"); }
    assert.ok(m.a !== "b" && m.b !== "a");
  }
  assert.equal(draw(["a", "b", "c"], [["a", "b"], ["a", "c"]]), null);
});

test("create, claim, match hidden from everyone else", async () => {
  assert.equal((await call("POST", "/api/links", { type: "gift", data: { people: ["Ana", "Bo"] } })).status, 400);
  assert.equal((await call("POST", "/api/links", { type: "gift", data: { people: ["Ana", "Bo", "ana"] } })).status, 400);
  const { status, j: made } = await call("POST", "/api/links", { type: "gift", data: { title: "Office", budget: "$30", people: ["Ana", "Bo", "Cy", "Di"], avoid: [[0, 1]] } });
  assert.equal(status, 201);
  const q = "?slug=" + made.slug, hk = { "x-host-key": made.hostKey };

  const host = await call("GET", "/api/links" + q, null, hk);
  assert.equal(host.j.isHost, true);
  assert.equal(host.j.link.data.pairs, undefined);
  assert.equal(host.j.link.data.avoid, undefined);
  const [ana, bo] = host.j.link.data.people;

  assert.equal((await call("POST", "/api/responses" + q, { id: A, k: "nope" })).status, 400);
  const claim = await call("POST", "/api/responses" + q, { id: A, k: ana.k, wish: "Socks" });
  assert.equal(claim.status, 200);
  assert.equal((await call("POST", "/api/responses" + q, { id: B, k: ana.k })).status, 400, "taken");
  assert.equal((await call("POST", "/api/responses" + q, { id: A, k: bo.k })).status, 400, "locked to one name");

  const mine = await call("GET", "/api/links" + q + "&me=" + A);
  assert.equal(mine.j.link.data.mine.k, ana.k);
  assert.ok(["Cy", "Di"].includes(mine.j.link.data.mine.to), "Ana and Bo kept apart");

  // Whoever drew Ana sees her wishlist; nobody else does.
  const ppl = host.j.link.data.people;
  let seen = 0;
  for (const [id, p] of [[B, ppl[1]], [C, ppl[2]]]) {
    await call("POST", "/api/responses" + q, { id, k: p.k });
    const m = (await call("GET", "/api/links" + q + "&me=" + id)).j.link.data.mine;
    if (m.to === "Ana") { assert.equal(m.toWish, "Socks"); seen++; } else assert.equal(m.toWish, "");
  }
  assert.ok(seen <= 1);

  // Host gets masked ids, so ?me= can't be used to peek.
  const h2 = await call("GET", "/api/links" + q, null, hk);
  assert.ok(!(A in h2.j.responses));
  assert.equal(Object.keys(h2.j.responses).length, 3);
  assert.equal(h2.j.link.data.mine, undefined);

  // Reset by name key frees it up.
  assert.equal((await call("DELETE", "/api/responses" + q + "&k=" + ana.k)).status, 403);
  await call("DELETE", "/api/responses" + q + "&k=" + ana.k, null, hk);
  const h3 = await call("GET", "/api/links" + q, null, hk);
  assert.equal(Object.keys(h3.j.responses).length, 2);

  // Edit keeps the draw.
  await call("PUT", "/api/links" + q, { data: { title: "Office party", budget: "$25", people: ["X", "Y", "Z"] } }, hk);
  const again = await call("GET", "/api/links" + q + "&me=" + B);
  assert.equal(again.j.link.data.title, "Office party");
  assert.deepEqual(again.j.link.data.people.map((p) => p.n), ["Ana", "Bo", "Cy", "Di"]);
  assert.equal(again.j.link.data.mine.k, bo.k);
});
