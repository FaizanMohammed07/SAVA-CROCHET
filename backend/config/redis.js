const Redis = require("ioredis");
const logger = require("../utils/logger");

let redisClient = null;
let redisAvailable = false;

const connectRedis = () => {
  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      username: process.env.REDIS_USERNAME || "default",
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn("Redis unavailable — running without cache.");
          return null;
        }
        return Math.min(times * 200, 2000);
      },
    });

    redisClient.on("connect", () => {
      redisAvailable = true;
      logger.info("Redis Cloud connected");
    });

    redisClient.on("error", (err) => {
      if (redisAvailable) {
        logger.error(`Redis error: ${err.message}`);
      }
      redisAvailable = false;
    });

    redisClient.on("close", () => {
      if (redisAvailable) {
        logger.warn("Redis connection closed");
      }
      redisAvailable = false;
    });

    return redisClient;
  } catch (error) {
    logger.error(`Redis connection failed: ${error.message}`);
    return null;
  }
};

/**
 * Get the Redis client instance.
 * Returns null if Redis is not available.
 */
const getRedisClient = () => {
  if (!redisClient) {
    connectRedis();
  }
  return redisAvailable ? redisClient : null;
};

/**
 * Check whether Redis is currently available
 */
const isRedisAvailable = () => redisAvailable;

/**
 * Attempt initial connection. Resolves even if Redis is down.
 */
const tryConnect = async () => {
  if (!redisClient) connectRedis();
  try {
    await redisClient.connect();
    await redisClient.ping();
    redisAvailable = true;
    logger.info("Redis Cloud connected successfully");
  } catch {
    redisAvailable = false;
    logger.warn(
      "Redis unavailable — caching disabled. App will run without cache.",
    );
  }
};

module.exports = { connectRedis, getRedisClient, isRedisAvailable, tryConnect };
