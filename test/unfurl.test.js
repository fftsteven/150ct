import { test } from "node:test";
import assert from "node:assert/strict";
import { unfurl, nameFromUrl, isMapsUrl } from "../core/unfurl.js";

test("reads names from full Google Maps URLs", () => {
  assert.equal(nameFromUrl("https://www.google.com/maps/place/Sonoratown/@34.04,-118.25,17z/data=!3m1"), "Sonoratown");
  assert.equal(nameFromUrl("https://www.google.com/maps/place/Park's+BBQ,+955+S+Vermont+Ave,+Los+Angeles/@34"), "Park's BBQ");
  assert.equal(nameFromUrl("https://maps.google.com/?q=Loqui+Culver+City"), "Loqui Culver City");
  assert.equal(nameFromUrl("https://www.google.com/maps/search/?api=1&query=Holbox"), "Holbox");
  assert.equal(nameFromUrl("https://maps.google.com/?q=34.04,-118.25"), "");
  assert.equal(nameFromUrl("https://consent.google.com/m?continue=" + encodeURIComponent("https://www.google.com/maps/place/Kato/@1,2")), "Kato");
});

test("follows share-link redirects, only on Google hosts", async () => {
  const hops = { "https://maps.app.goo.gl/abc": "https://www.google.com/maps/place/Holbox/@34,-118,17z" };
  const fake = async (u) => ({ headers: new Headers(hops[u] ? { location: hops[u] } : {}) });
  assert.equal(await unfurl("https://maps.app.goo.gl/abc", fake), "Holbox");
  assert.equal(await unfurl("https://evil.example/x", fake), "");
  const bad = async () => ({ headers: new Headers({ location: "http://169.254.169.254/" }) });
  assert.equal(await unfurl("https://maps.app.goo.gl/zzz", bad), "");
  assert.ok(!isMapsUrl("http://maps.app.goo.gl/abc"), "https only");
});
