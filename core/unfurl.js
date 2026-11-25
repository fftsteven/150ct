// Turns a pasted Google Maps link into a place name, with no API key.
// Share links (maps.app.goo.gl/…) redirect to a full google.com/maps URL that carries the name.
// Only Google hosts are followed, one hop at a time, so this can't be pointed elsewhere.

const HOSTS = /^(maps\.app\.goo\.gl|goo\.gl|(www\.|maps\.)?google\.[a-z.]{2,6}|consent\.google\.[a-z.]{2,6})$/;

export const isMapsUrl = (s) => {
  try { const u = new URL(s); return u.protocol === "https:" && HOSTS.test(u.hostname); } catch { return false; }
};

const clean = (s) => decodeURIComponent(String(s).replace(/\+/g, " ")).trim();

// Name from a full Google Maps URL, or "" if it doesn't carry one.
export function nameFromUrl(s) {
  let u;
  try { u = new URL(s); } catch { return ""; }
  if (/^consent\./.test(u.hostname) && u.searchParams.get("continue")) return nameFromUrl(u.searchParams.get("continue"));
  const m = u.pathname.match(/\/maps\/(?:place|search)\/([^/@]+)/);
  if (m) return clean(m[1]).split(",")[0].trim();
  const q = u.searchParams.get("q") || u.searchParams.get("query");
  if (q && !/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(q)) return clean(q).split(",")[0].trim();
  return "";
}

export async function unfurl(link, fetcher = fetch) {
  let url = String(link || "").trim();
  if (!isMapsUrl(url)) return "";
  for (let hop = 0; hop < 5; hop++) {
    const name = nameFromUrl(url);
    if (name) return name.slice(0, 60);
    const r = await fetcher(url, { redirect: "manual", headers: { "user-agent": "Mozilla/5.0 (compatible; 150ct)" } });
    const next = r.headers.get("location");
    if (!next) return "";
    url = new URL(next, url).toString();
    if (!isMapsUrl(url)) return "";
  }
  return "";
}
