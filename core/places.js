// Google Places (New) lookups for Where to eat. The key stays on the server (GOOGLE_MAPS_API_KEY).
//
// GET /api/places?q=<text>&s=<session>        -> { results: [{ id, name, area }] }   Autocomplete
// GET /api/places?id=<placeId>&s=<session>    -> { place: { id, name, area, url } }  Details, ends the session
//
// Cost: Autocomplete calls that share a session token and end in one Details call are billed as that
// one Details call. Details asks only for Essentials fields (id, displayName, formattedAddress).
// Location bias comes from Vercel's IP geolocation headers, so no browser location prompt.

const BASE = "https://places.googleapis.com/v1";
const SESSION_RE = /^[A-Za-z0-9_-]{8,64}$/;
const ID_RE = /^[A-Za-z0-9_-]{10,300}$/;

export const placesKey = () => (typeof process !== "undefined" && process.env && process.env.GOOGLE_MAPS_API_KEY) || "";

export const mapsLink = (name, id) =>
  "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(name) + (id ? "&query_place_id=" + encodeURIComponent(id) : "");

function bias(request) {
  const lat = parseFloat(request.headers.get("x-vercel-ip-latitude"));
  const lng = parseFloat(request.headers.get("x-vercel-ip-longitude"));
  if (!isFinite(lat) || !isFinite(lng)) return {};
  return { locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 50000 } } };
}

export async function autocomplete(request, q, session, key, fetcher = fetch) {
  const input = String(q || "").trim().slice(0, 100);
  if (input.length < 2) return [];
  const r = await fetcher(BASE + "/places:autocomplete", {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({ input, ...(SESSION_RE.test(session || "") ? { sessionToken: session } : {}), ...bias(request) }),
  });
  if (!r.ok) throw new Error("places " + r.status);
  const j = await r.json();
  return (j.suggestions || []).map((s) => s.placePrediction).filter(Boolean).slice(0, 5).map((p) => ({
    id: p.placeId,
    name: p.structuredFormat?.mainText?.text || p.text?.text || "",
    area: p.structuredFormat?.secondaryText?.text || "",
  })).filter((p) => p.id && p.name);
}

export async function details(id, session, key, fetcher = fetch) {
  if (!ID_RE.test(id || "")) return null;
  const qs = SESSION_RE.test(session || "") ? "?sessionToken=" + encodeURIComponent(session) : "";
  const r = await fetcher(BASE + "/places/" + encodeURIComponent(id) + qs, {
    headers: { "x-goog-api-key": key, "x-goog-fieldmask": "id,displayName,formattedAddress" },
  });
  if (!r.ok) throw new Error("places " + r.status);
  const p = await r.json();
  const name = String(p.displayName?.text || "").slice(0, 60);
  return name ? { id: p.id, name, area: String(p.formattedAddress || "").slice(0, 160), url: mapsLink(name, p.id) } : null;
}
