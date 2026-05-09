import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "", {
  maxRetriesPerRequest: 0,  // fail immediately so the fallback kicks in fast
  enableReadyCheck: false,  // skip the PING on connect — reduces startup latency
  lazyConnect: true,
  connectTimeout: 3000,
});

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("❌ Redis error:", err.message));

export default redis;
