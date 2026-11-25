// Minimal in-memory stand-in for the @upstash/redis calls we use.
export function mockRedis() {
  const kv = new Map(), hashes = new Map();
  return {
    async get(k) { return kv.has(k) ? kv.get(k) : null; },
    async set(k, v) { kv.set(k, v); return "OK"; },
    async del(...ks) { ks.forEach((k) => { kv.delete(k); hashes.delete(k); }); return ks.length; },
    async incr(k) { const n = (+kv.get(k) || 0) + 1; kv.set(k, n); return n; },
    async expire() { return 1; },
    async hgetall(k) { const h = hashes.get(k); return h && h.size ? Object.fromEntries(h) : null; },
    async hset(k, o) { const h = hashes.get(k) || new Map(); Object.entries(o).forEach(([f, v]) => h.set(f, v)); hashes.set(k, h); return 1; },
    async hdel(k, f) { hashes.get(k)?.delete(f); return 1; },
    dump: () => ({ kv: [...kv], h: [...hashes].map(([k, m]) => [k, [...m]]) }),
    load(d) { d.kv.forEach(([k, v]) => kv.set(k, v)); d.h.forEach(([k, m]) => hashes.set(k, new Map(m))); },
  };
}
