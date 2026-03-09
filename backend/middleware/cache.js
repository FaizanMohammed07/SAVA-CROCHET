const { getRedisClient } = require("../config/redis");
const logger = require("../utils/logger");

/**
 * Redis cache middleware
 * @param {string} keyPrefix - cache key prefix
 * @param {number} ttl - time to live in seconds
 */
const cache = (keyPrefix, ttl = 300) => {
  return async (req, res, next) => {
    const redis = getRedisClient();
    if (!redis) return next();

    try {
      // Build cache key from URL + query params
      const key = `${keyPrefix}:${req.originalUrl}`;
      const cached = await redis.get(key);

      if (cached) {
        const data = JSON.parse(cached);
        return res.status(200).json({
          success: true,
          message: "Success (cached)",
          ...data,
        });
      }

      // Override res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode === 200 && body.success) {
          redis.setex(key, ttl, JSON.stringify(body)).catch((err) => {
            logger.error(`Cache set error: ${err.message}`);
          });
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      logger.error(`Cache middleware error: ${err.message}`);
      next();
    }
  };
};

/**
 * Invalidate cache by prefix pattern
 */
const invalidateCache = async (pattern) => {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const keys = await redis.keys(`${pattern}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(`Invalidated ${keys.length} cache keys matching: ${pattern}`);
    }
  } catch (err) {
    logger.error(`Cache invalidation error: ${err.message}`);
  }
};

module.exports = { cache, invalidateCache };
