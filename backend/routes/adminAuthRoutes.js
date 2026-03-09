const express = require("express");
const router = express.Router();
const adminAuthController = require("../controllers/adminAuthController");
const {
  adminLoginLimiter,
  adminVerify2FALimiter,
  adminSetup2FALimiter,
} = require("../middleware/rateLimiter");

// ── Credentials check ──────────────────────────────────────
// Strict: 5 failed attempts / 15 min (successful requests don't count)
router.post("/login", adminLoginLimiter, adminAuthController.adminLogin);

// ── 2FA verification (returning admins) ────────────────────
// Moderate: 10 failed attempts / 15 min — JWT temp-token is the main gate
router.post(
  "/verify-2fa",
  adminVerify2FALimiter,
  adminAuthController.adminVerify2FA,
);

// ── 2FA first-time setup (get QR) ─────────────────────────
// Lenient: 15 / 15 min — only reachable with valid setup temp-token
router.post(
  "/setup-2fa",
  adminSetup2FALimiter,
  adminAuthController.adminSetup2FA,
);

// ── 2FA confirm setup (verify first code + enable) ────────
// Same as verify — TOTP brute-force protection
router.post(
  "/confirm-setup-2fa",
  adminVerify2FALimiter,
  adminAuthController.adminConfirmSetup2FA,
);

// ── 2FA time sync check — diagnostic for clock drift debugging ──
router.get("/time-sync", adminAuthController.adminCheck2FASync);

// All other paths return 404 (hide existence of this route group)
router.all("*", (req, res) => {
  res.status(404).json({ success: false, message: "Resource not found" });
});

module.exports = router;
