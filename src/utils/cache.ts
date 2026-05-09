import redis from "@/db/redis";

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached !== null) return JSON.parse(cached) as T;

    const fresh = await fetchFn();
    if (fresh !== null && fresh !== undefined) {
      await redis.setex(key, ttlSeconds, JSON.stringify(fresh));
    }
    return fresh;
  } catch (err: any) {
    // Redis down → fall through to DB, never crash the app
    console.error("[cache] Redis error, falling back:", err.message);
    return fetchFn();
  }
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
