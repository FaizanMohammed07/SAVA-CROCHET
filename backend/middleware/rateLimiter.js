const rateLimit = require("express-rate-limit");
const { getRedisClient, isRedisAvailable } = require("../config/redis");
const logger = require("../utils/logger");

/**
 * Build a Redis store for rate limiting (production: distributed, multi-instance safe).
 * Falls back to in-memory if Redis is unavailable.
 */
const getStore = () => {
  if (isRedisAvailable()) {
    try {
      const { RedisStore } = require("rate-limit-redis");
      return new RedisStore({
        sendCommand: (...args) => getRedisClient().call(...args),
        prefix: "rl:", // all rate-limit keys prefixed in Redis
      });
    } catch {
      logger.warn("rate-limit-redis unavailable — falling back to in-memory store");
    }
  }
  return undefined; // express-rate-limit uses MemoryStore by default
};

/**
 * Create a rate limiter with sensible defaults + optional Redis store.
 * @param {object} opts - express-rate-limit options
 */
const createLimiter = (opts) =>
  rateLimit({
    standardHeaders: true, // Return rate-limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    store: getStore(),
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: opts.message?.message || "Too many requests. Please try again later.",
      });
    },
    ...opts,
  });

// ════════════════════════════════════════════════════════════
// PUBLIC / GENERAL
// ════════════════════════════════════════════════════════════

/** Global API limiter — generous for normal browsing */
const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 150,
  message: { message: "Too many requests from this IP. Please try again after 15 minutes." },
});

// ════════════════════════════════════════════════════════════
// AUTH — Customer login/register/password flows
// ════════════════════════════════════════════════════════════

/** Customer login — only failed attempts count */
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: { message: "Too many login attempts. Try again after 15 minutes." },
});

/** Password reset — strict per-IP throttle */
const passwordResetLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { message: "Too many password reset attempts. Try again after 1 hour." },
});

/** 2FA setup/verify — moderate (JWT temp-token is the primary gate) */
const twoFactorLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many 2FA attempts. Please try again later." },
});

// ════════════════════════════════════════════════════════════
// PAYMENT
// ════════════════════════════════════════════════════════════

const paymentLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { message: "Too many payment requests. Please try again later." },
});

// ════════════════════════════════════════════════════════════
// ADMIN — Operational routes (after login)
// ════════════════════════════════════════════════════════════

/** Admin panel operations — stricter than public API */
const adminLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 80,
  message: { message: "Too many admin requests. Please try again later." },
});

// ════════════════════════════════════════════════════════════
// ADMIN AUTH — Login / 2FA (separate, purpose-specific limiters)
// ════════════════════════════════════════════════════════════

/**
 * Admin login (credentials) — STRICT.
 * Only failed attempts count. Brute-force protection.
 * 5 failed logins per IP per 15 min is generous enough for a real admin
 * but locks out attackers quickly.
 */
const adminLoginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true, // successful credential checks don't consume quota
  message: { message: "Too many failed login attempts. Please try again after 15 minutes." },
  keyGenerator: (req) => `admin-login:${req.ip}`, // namespace keys to avoid collision
});

/**
 * Admin 2FA verify — moderate.
 * The JWT temp-token (3 min expiry) is the primary security gate.
 * This limiter is a second layer against automated TOTP brute-force.
 */
const adminVerify2FALimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: { message: "Too many verification attempts. Please try again later." },
  keyGenerator: (req) => `admin-2fa:${req.ip}`,
});

/**
 * Admin 2FA setup — lenient.
 * Only reachable with a valid setup temp-token (10 min expiry).
 * These are legitimate one-time setup flows, not attack vectors.
 */
const adminSetup2FALimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { message: "Too many setup attempts. Please try again later." },
  keyGenerator: (req) => `admin-setup:${req.ip}`,
});

module.exports = {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  paymentLimiter,
  adminLimiter,
  twoFactorLimiter,
  // Admin auth specific
  adminLoginLimiter,
  adminVerify2FALimiter,
  adminSetup2FALimiter,
};
