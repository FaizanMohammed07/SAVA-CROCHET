const logger = require("../utils/logger");

/**
 * Audit logging middleware for admin actions.
 * Logs all non-GET (state-changing) requests with user info.
 * Attach AFTER protect + authorize middleware so req.user is available.
 */
const auditLogger = (req, res, next) => {
  // Only log state-changing methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const startTime = Date.now();

  // Capture after response finishes to include status code
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const entry = {
      type: "ADMIN_AUDIT",
      timestamp: new Date().toISOString(),
      user: {
        id: req.user?._id?.toString() || "unknown",
        email: req.user?.email || "unknown",
        role: req.user?.role || "unknown",
      },
      action: {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      },
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get("user-agent") || "unknown",
    };

    // Log at warn level for visibility — easy to filter in production
    logger.warn(`[ADMIN_AUDIT] ${entry.user.email} ${entry.action.method} ${entry.action.path} → ${entry.action.statusCode} (${entry.action.duration})`, entry);
  });

  next();
};

module.exports = auditLogger;
