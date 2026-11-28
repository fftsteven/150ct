import { test } from "node:test";
import assert from "node:assert/strict";
import { mockRedis } from "./mock-redis.js";

globalThis.__MOCK_REDIS = mockRedis();
const { handle } = await import("../core/handler.js");
const { winner } = await import("../apps/squares/server.js");

const call = async (method, path, body, headers = {}) => {
  const r = await handle(new Request("http://x" + path, {
    method, headers: { "content-type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  }));
  return { status: r.status, j: await r.json() };
};
const A = "a".repeat(24), B = "b".repeat(24), H = "h".repeat(24);

test("pick squares, first tap wins, everyone sees names, host fills in for others", async () => {
  const { status, j: made } = await call("POST", "/api/links", { type: "squares", data: { top: "Hawks", side: "Bears", cost: "$5" } });
  assert.equal(status, 201);
  const q = "?slug=" + made.slug, hk = { "x-host-key": made.hostKey };
  const ev = (await call("GET", "/api/links" + q)).j.link.data;
  assert.equal(ev.title, "Football squares");
  assert.equal(ev.locked, false);
  assert.equal(ev.cols, null);

  assert.equal((await call("POST", "/api/responses" + q, { id: A, cells: { 3: "" } })).status, 400, "name needed");
  assert.equal((await call("POST", "/api/responses" + q, { id: A, name: "Ana", cells: { 3: "x", 4: "x", 250: "x", foo: "x" } })).status, 200);
  const clash = await call("POST", "/api/responses" + q, { id: B, name: "Bo", cells: { 4: "", 5: "" } });
  assert.equal(clash.status, 409);
  const host = await call("POST", "/api/responses" + q, { id: H, name: "Host", cells: { 10: "Gran", 11: "" } }, hk);
  assert.equal(host.status, 200);

  const guest = await call("GET", "/api/links" + q + "&me=" + B);
  assert.deepEqual(guest.j.responses[B], { cells: { 5: "Bo" } });
  const all = Object.values(guest.j.responses).map((r) => r.cells);
  assert.ok(all.some((c) => c[3] === "Ana" && c[4] === "Ana" && !("250" in c)), "guests see names, guest names forced to their own");
  assert.ok(all.some((c) => c[10] === "Gran" && c[11] === "Host"), "host can fill in others");
  assert.ok(!(A in guest.j.responses), "ids masked");
});

test("lock draws numbers once, then squares freeze and scores pick winners", async () => {
  const { j: made } = await call("POST", "/api/links", { type: "squares", data: { title: "Game day" } });
  const q = "?slug=" + made.slug, hk = { "x-host-key": made.hostKey };
  await call("POST", "/api/responses" + q, { id: A, name: "Ana", cells: { 0: "" } });
  assert.equal((await call("PUT", "/api/links" + q, { data: { scores: [{ a: 7, b: 3 }] } }, hk)).status, 400, "no scores before lock");
  assert.equal((await call("PUT", "/api/links" + q, { data: { lock: true } })).status, 403, "only host locks");
  assert.equal((await call("PUT", "/api/links" + q, { data: { lock: true } }, hk)).status, 200);
  const ev = (await call("GET", "/api/links" + q)).j.link.data;
  assert.equal(ev.title, "Game day", "lock keeps details");
  assert.deepEqual([...ev.cols].sort(), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual([...ev.rows].sort(), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

  await call("PUT", "/api/links" + q, { data: { lock: true } }, hk);
  const again = (await call("GET", "/api/links" + q)).j.link.data;
  assert.deepEqual([again.cols, again.rows], [ev.cols, ev.rows], "numbers never redraw");

  assert.equal((await call("POST", "/api/responses" + q, { id: B, name: "Bo", cells: { 1: "" } })).status, 400, "locked");

  // Ana's square 0 wins when the score's last digits match row 0 and column 0.
  const s = { a: 10 + ev.cols[0], b: 20 + ev.rows[0] };
  assert.equal(winner(ev, s), 0);
  assert.equal((await call("PUT", "/api/links" + q, { data: { scores: [s, null, { a: -1, b: 2 }, { a: 31, b: 24 }], top: "Hawks" } }, hk)).status, 200);
  const done = (await call("GET", "/api/links" + q)).j.link.data;
  assert.deepEqual(done.scores, [s, null, null, { a: 31, b: 24 }]);
  assert.equal(done.top, "Hawks");
  assert.equal(done.locked, true);
});

test("create_squares over MCP returns links", async () => {
  const r = await handle(new Request("http://x/api/mcp", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "create_squares", arguments: { topTeam: "Hawks", sideTeam: "Bears", cost: "$5" } } }),
  }));
  const out = (await r.json()).result;
  assert.ok(!out.isError);
  assert.match(out.structuredContent.guestLink, /^https:\/\/150ct\.com\/squares\/[a-z0-9]{8}$/);
  const slug = out.structuredContent.guestLink.split("/").pop();
  const ev = (await call("GET", "/api/links?slug=" + slug)).j.link.data;
  assert.deepEqual([ev.top, ev.side, ev.cost], ["Hawks", "Bears", "$5"]);
});
