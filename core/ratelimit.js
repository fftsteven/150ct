import { redis, K } from "./store.js";
import { sha, clientIp } from "./util.js";

// Fixed hourly window per IP per bucket. Returns true when over the limit.
export async function limited(request, bucket, max) {
  const who = (await sha(clientIp(request))).slice(0, 16);
  const key = K.rl(bucket, who, Math.floor(Date.now() / 3600e3));
  const n = await redis().incr(key);
  if (n === 1) await redis().expire(key, 3600);
  return n > max;
}
