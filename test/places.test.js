import { test } from "node:test";
import assert from "node:assert/strict";
import { autocomplete, details, mapsLink } from "../core/places.js";

const req = new Request("http://x", { headers: { "x-vercel-ip-latitude": "34.05", "x-vercel-ip-longitude": "-118.25" } });

test("autocomplete sends the key, session and IP bias, and shapes results", async () => {
  let sent;
  const fake = async (url, o) => { sent = { url, o, body: JSON.parse(o.body) }; return new Response(JSON.stringify({ suggestions: [
    { placePrediction: { placeId: "ChIJabc1234567", text: { text: "Sonoratown, E 8th St" }, structuredFormat: { mainText: { text: "Sonoratown" }, secondaryText: { text: "E 8th St, Los Angeles" } } } },
    { queryPrediction: { text: { text: "sonoran food" } } },
  ] })); };
  const out = await autocomplete(req, "sonora", "sess_12345678", "KEY", fake);
  assert.deepEqual(out, [{ id: "ChIJabc1234567", name: "Sonoratown", area: "E 8th St, Los Angeles" }]);
  assert.equal(sent.o.headers["x-goog-api-key"], "KEY");
  assert.equal(sent.body.sessionToken, "sess_12345678");
  assert.equal(sent.body.locationBias.circle.center.latitude, 34.05);
  assert.deepEqual(await autocomplete(req, "s", "x", "KEY", fake), [], "too short, no call");
});

test("details uses an Essentials field mask and builds a place-id map link", async () => {
  let sent;
  const fake = async (url, o) => { sent = { url, o }; return new Response(JSON.stringify({ id: "ChIJabc1234567", displayName: { text: "Sonoratown" }, formattedAddress: "208 E 8th St" })); };
  const p = await details("ChIJabc1234567", "sess_12345678", "KEY", fake);
  assert.equal(sent.o.headers["x-goog-fieldmask"], "id,displayName,formattedAddress");
  assert.ok(sent.url.includes("sessionToken=sess_12345678"));
  assert.equal(p.url, mapsLink("Sonoratown", "ChIJabc1234567"));
  assert.equal(await details("../evil", "s", "KEY", fake), null);
});
