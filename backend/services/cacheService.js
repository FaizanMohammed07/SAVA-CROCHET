const { getRedisClient } = require("../config/redis");
const logger = require("../utils/logger");

class CacheService {
  /**
   * Get value from cache
   */
  async get(key) {
    const redis = getRedisClient();
    if (!redis) return null;

    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      logger.error(`Cache get error [${key}]: ${err.message}`);
      return null;
    }
  }

  /**
   * Set cache with TTL
   */
  async set(key, data, ttl = 300) {
    const redis = getRedisClient();
    if (!redis) return;

    try {
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (err) {
      logger.error(`Cache set error [${key}]: ${err.message}`);
    }
  }

  /**
   * Delete specific key
   */
  async del(key) {
    const redis = getRedisClient();
    if (!redis) return;

    try {
      await redis.del(key);
    } catch (err) {
      logger.error(`Cache del error [${key}]: ${err.message}`);
    }
  }

  /**
   * Delete keys matching a pattern
   */
  async invalidatePattern(pattern) {
    const redis = getRedisClient();
    if (!redis) return;

    try {
      let cursor = "0";
      do {
        const [nextCursor, keys] = await redis.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100,
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } while (cursor !== "0");
    } catch (err) {
      logger.error(`Cache invalidation error [${pattern}]: ${err.message}`);
    }
  }

  /**
   * Get or set cache (cache-aside pattern)
   */
  async getOrSet(key, fetchFn, ttl = 300) {
    const cached = await this.get(key);
    if (cached) return cached;

    const data = await fetchFn();
    await this.set(key, data, ttl);
    return data;
  }

  /**
   * Flush all cache
   */
  async flushAll() {
    const redis = getRedisClient();
    if (!redis) return;

    try {
      await redis.flushdb();
      logger.info("Cache flushed");
    } catch (err) {
      logger.error(`Cache flush error: ${err.message}`);
    }
  }
}

module.exports = new CacheService();
