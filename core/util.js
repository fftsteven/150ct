// Runtime-neutral helpers. Web Crypto only, so this runs on Node, Vercel and Cloudflare Workers.

const ALPHA = "abcdefghjkmnpqrstuvwxyz23456789";

export function rand(n) {
  const b = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(b, (x) => ALPHA[x % ALPHA.length]).join("");
}

export async function sha(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(s)));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export const str = (v, max) => String(v ?? "").trim().slice(0, max);

export function parse(v) {
  if (v == null) return null;
  if (typeof v === "string") { try { return JSON.parse(v); } catch { return null; } }
  return v;
}

export function json(status, data, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...headers },
  });
}

export function clientIp(request) {
  const h = request.headers;
  return String(h.get("cf-connecting-ip") || h.get("x-real-ip") || h.get("x-forwarded-for") || "?").split(",")[0].trim();
}
