// Storage. Upstash Redis over HTTP (works on any runtime). dev.js swaps in an in-memory mock.
import { Redis } from "@upstash/redis";

let client;
export function redis(env = globalThis.process?.env || {}) {
  if (globalThis.__MOCK_REDIS) return globalThis.__MOCK_REDIS;
  if (!client) {
    client = new Redis({
      url: env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL,
      token: env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return client;
}

// All keys live under one prefix so the database can be shared safely.
export const K = {
  link: (slug) => `150ct:link:${slug}`,
  resp: (slug) => `150ct:resp:${slug}`,
  rl: (bucket, who, hour) => `150ct:rl:${bucket}:${who}:${hour}`,
  // Reserved for Plus (not used yet): set of slugs an owner has made.
  owner: (ownerId) => `150ct:owner:${ownerId}`,
};
