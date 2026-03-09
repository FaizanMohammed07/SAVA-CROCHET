const User = require("../models/User");
const logger = require("../utils/logger");

/**
 * Seed default admin user from .env on first startup.
 * - Runs once: skips if admin already exists in DB.
 * - Marks email as verified so admin can login immediately.
 */
const seedAdmin = async () => {
  const {
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    ADMIN_FIRST_NAME,
    ADMIN_LAST_NAME,
    ADMIN_PHONE,
  } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    logger.info("No ADMIN_EMAIL/ADMIN_PASSWORD in .env — skipping admin seed");
    return;
  }

  try {
    const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (existing) {
      // Ensure existing admin hasn't been accidentally downgraded
      if (existing.role !== "superadmin" && existing.role !== "admin") {
        existing.role = "superadmin";
        await existing.save({ validateBeforeSave: false });
        logger.info(`Restored superadmin role for ${ADMIN_EMAIL}`);
      }
      return; // Already exists — nothing to do
    }

    await User.create({
      firstName: ADMIN_FIRST_NAME || "Sava",
      lastName: ADMIN_LAST_NAME || "Admin",
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      phone: ADMIN_PHONE || "",
      role: "superadmin",
      isEmailVerified: true, // Skip email verification for seed admin
    });

    logger.info(`✅ Default superadmin created: ${ADMIN_EMAIL}`);
  } catch (err) {
    logger.error("Failed to seed admin user:", err.message);
  }
};

module.exports = seedAdmin;
