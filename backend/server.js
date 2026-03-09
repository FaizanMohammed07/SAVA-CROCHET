require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

const connectDB = require("./config/db");
const seedAdmin = require("./config/seedAdmin");
const {
  getRedisClient,
  tryConnect: tryRedisConnect,
} = require("./config/redis");
const { configureCloudinary } = require("./config/cloudinary");
const logger = require("./utils/logger");
const { apiLimiter } = require("./middleware/rateLimiter");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const visitorTracker = require("./middleware/visitorTracker");
const queueService = require("./services/queueService");

// Route imports
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const visitorRoutes = require("./routes/visitorRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// ----- Global Middleware -----

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

// Request logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: { write: (message) => logger.info(message.trim()) },
    }),
  );
}

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookie parser
app.use(cookieParser());

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent HTTP param pollution
app.use(
  hpp({
    whitelist: [
      "price",
      "rating",
      "category",
      "tags",
      "color",
      "size",
      "material",
    ],
  }),
);

// Response compression
app.use(compression());

// Rate limiting (applied to all API routes)
app.use("/api", apiLimiter);

// Visitor tracking (for analytics — non-blocking)
app.use(visitorTracker);

// ----- Health Check -----
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ----- API Routes -----
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use(
  `/api/auth/${process.env.ADMIN_LOGIN_SLUG || "admin-portal-x7k9"}`,
  adminAuthRoutes,
);
app.use("/api/visitors", visitorRoutes);

// ----- Error Handling -----
app.use(notFound);
app.use(errorHandler);

// ----- Server Startup -----
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info("MongoDB connected successfully");

    // Configure Cloudinary
    configureCloudinary();

    // Seed default admin user (skips if already exists)
    await seedAdmin();

    // Connect to Redis (optional — app works without it)
    await tryRedisConnect();

    // Background job queues initialize lazily on first use via queueService.getQueue()
    logger.info("Background job queues ready (lazy initialization)");

    // Start Express server
    const server = app.listen(PORT, () => {
      logger.info(
        `🚀 SAVA CROCHETS API running on port ${PORT} [${process.env.NODE_ENV || "development"}]`,
      );
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info("HTTP server closed");

        try {
          await queueService.gracefulShutdown();
          logger.info("Queue workers stopped");
        } catch (err) {
          logger.error("Error shutting down queues:", err);
        }

        try {
          const redis = getRedisClient();
          if (redis) {
            await redis.quit();
            logger.info("Redis connection closed");
          }
        } catch (err) {
          // Redis may not be connected
        }

        try {
          const mongoose = require("mongoose");
          await mongoose.connection.close();
          logger.info("MongoDB connection closed");
        } catch (err) {
          logger.error("Error closing MongoDB:", err);
        }

        logger.info("Graceful shutdown complete");
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 30000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err) => {
      logger.error("UNHANDLED REJECTION:", err);
      gracefulShutdown("UNHANDLED REJECTION");
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (err) => {
      logger.error("UNCAUGHT EXCEPTION:", err);
      gracefulShutdown("UNCAUGHT EXCEPTION");
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app; // For testing
