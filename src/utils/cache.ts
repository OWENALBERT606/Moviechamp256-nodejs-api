import redis from "@/db/redis";

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // 1. Try Redis first — fail immediately if down (maxRetriesPerRequest: 0)
  let cached: string | null = null;
  try {
    cached = await redis.get(key);
  } catch (err: any) {
    // Redis is unavailable → go straight to DB, don't double-call later
    console.error("[cache] Redis GET failed, falling back to DB:", err.message);
    return fetchFn();
  }

  // 2. Cache hit
  if (cached !== null) {
    try {
      return JSON.parse(cached) as T;
    } catch {
      // Corrupt cache entry — fall through to DB
    }
  }

  // 3. Cache miss — fetch from DB/source
  const fresh = await fetchFn();

  // 4. Write to Redis best-effort — never block or double-call fetchFn
  if (fresh !== null && fresh !== undefined) {
    redis
      .setex(key, ttlSeconds, JSON.stringify(fresh))
      .catch((err: any) =>
        console.error("[cache] Redis SET failed (non-fatal):", err.message)
      );
  }

  return fresh;
}

export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err: any) {
    console.error("[cache] Failed to invalidate key:", key, err.message);
  }
}

export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch (err: any) {
    console.error("[cache] Failed to invalidate pattern:", pattern, err.message);
  }
}
