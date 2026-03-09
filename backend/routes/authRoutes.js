const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const twoFactorController = require("../controllers/twoFactorController");
const { protect } = require("../middleware/auth");
const {
  authLimiter,
  passwordResetLimiter,
  twoFactorLimiter,
} = require("../middleware/rateLimiter");
const validate = require("../middleware/validate");
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
} = require("../validators/authValidator");

// Public routes
router.post(
  "/register",
  authLimiter,
  registerValidator,
  validate,
  authController.register,
);
router.post(
  "/login",
  authLimiter,
  loginValidator,
  validate,
  authController.login,
);
router.post(
  "/forgot-password",
  passwordResetLimiter,
  forgotPasswordValidator,
  validate,
  authController.forgotPassword,
);
router.put(
  "/reset-password/:token",
  resetPasswordValidator,
  validate,
  authController.resetPassword,
);
router.get("/verify-email/:token", authController.verifyEmail);
router.post("/refresh-token", authController.refreshToken);

// Protected routes
router.post("/logout", protect, authController.logout);
router.put(
  "/change-password",
  protect,
  changePasswordValidator,
  validate,
  authController.changePassword,
);
router.get("/me", protect, authController.getMe);

// ─── Two-Factor Authentication Routes ──────────────────────
// Public: verify 2FA during login (rate-limited)
router.post(
  "/2fa/verify-login",
  twoFactorLimiter,
  twoFactorController.verify2FALogin,
);

// Protected: manage 2FA settings
router.post("/2fa/setup", protect, twoFactorController.setup2FA);
router.post(
  "/2fa/verify-setup",
  protect,
  twoFactorLimiter,
  twoFactorController.verifySetup2FA,
);
router.post("/2fa/disable", protect, twoFactorController.disable2FA);
router.post(
  "/2fa/backup-codes",
  protect,
  twoFactorController.regenerateBackupCodes,
);

module.exports = router;
