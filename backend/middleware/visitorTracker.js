const { v4: uuidv4 } = require("uuid");
const UAParser = require("ua-parser-js");
const Visitor = require("../models/Visitor");
const logger = require("../utils/logger");

/**
 * Track website visitors
 */
const visitorTracker = async (req, res, next) => {
  try {
    // Skip API documentation and health check routes
    if (req.path === "/health" || req.path.startsWith("/api-docs")) {
      return next();
    }

    const parser = new UAParser(req.headers["user-agent"]);
    const device = parser.getDevice();
    const browser = parser.getBrowser();
    const os = parser.getOS();

    // Determine device type
    let deviceType = "desktop";
    if (device.type === "mobile") deviceType = "mobile";
    else if (device.type === "tablet") deviceType = "tablet";
    else if (
      parser.getResult().ua &&
      /bot|crawl|spider/i.test(parser.getResult().ua)
    ) {
      deviceType = "bot";
    }

    // Get or create session ID from cookie
    let sessionId = req.cookies?.visitorSession;
    let isNewSession = false;

    if (!sessionId) {
      sessionId = uuidv4();
      isNewSession = true;
      res.cookie("visitorSession", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 60 * 1000, // 30 min session
        sameSite: "lax",
      });
    }

    // Check if returning visitor
    const existingVisits = await Visitor.countDocuments({
      ip: req.ip,
      sessionId: { $ne: sessionId },
    });

    if (isNewSession) {
      // Create new visitor record
      const visitor = new Visitor({
        sessionId,
        userId: req.user?._id || null,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        device: {
          type: device.type,
          vendor: device.vendor,
          model: device.model,
        },
        browser: { name: browser.name, version: browser.version },
        os: { name: os.name, version: os.version },
        deviceType,
        referrer: req.headers.referer || req.headers.referrer || "",
        landingPage: req.originalUrl,
        isReturning: existingVisits > 0,
        pagesVisited: [{ path: req.originalUrl, visitedAt: new Date() }],
      });

      await visitor.save();
    } else {
      // Update existing session
      await Visitor.findOneAndUpdate(
        { sessionId },
        {
          $push: {
            pagesVisited: { path: req.originalUrl, visitedAt: new Date() },
          },
          $set: {
            sessionEnd: new Date(),
            userId: req.user?._id || undefined,
          },
        },
      );
    }

    req.sessionId = sessionId;
    next();
  } catch (err) {
    // Don't block request on tracking error
    logger.error(`Visitor tracking error: ${err.message}`);
    next();
  }
};

module.exports = visitorTracker;
