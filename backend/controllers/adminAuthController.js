const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { sanitizeUser } = require("../utils/helpers");
const {
  generateSecret,
  generateURI,
  verifySync,
  generateSync,
} = require("otplib");
const logger = require("../utils/logger");

// ─── Constants ─────────────────────────────────────────────
const TOTP_WINDOW = 3; // ±90 seconds clock drift tolerance
const TOTP_SETUP_WINDOW = 5; // ±150 seconds for first-time setup (user scans QR + types code)
const MAX_2FA_ATTEMPTS = 5; // Lock after 5 failed 2FA attempts
const LOCK_2FA_MINUTES = 15; // Lock 2FA for 15 minutes
const TEMP_TOKEN_EXPIRY_2FA = "5m"; // 5 min to enter TOTP
const TEMP_TOKEN_EXPIRY_SETUP = "10m"; // 10 min for first-time setup
const JWT_2FA_KEY_SUFFIX = ":admin-2fa";

// ─── Helpers ───────────────────────────────────────────────

/**
 * Log admin auth security events — full audit trail
 */
const logAdminAuthEvent = (event, data) => {
  logger.warn(`[ADMIN_AUTH] ${event}`, {
    type: "ADMIN_AUTH",
    event,
    timestamp: new Date().toISOString(),
    ...data,
  });
};

/**
 * Set admin JWT cookies (shorter-lived than regular user cookies)
 */
const setAdminTokenCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: "/",
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day for admin
    path: "/api/auth",
  });
};

/**
 * Generate 8 cryptographically secure backup codes (8 hex chars each)
 */
const generateBackupCodes = () => {
  const codes = [];
  for (let i = 0; i < 8; i++) {
    codes.push(crypto.randomBytes(4).toString("hex"));
  }
  return codes;
};

/**
 * Validate TOTP code format — exactly 6 digits
 */
const isValidTOTPFormat = (token) => {
  if (!token) return false;
  return /^\d{6}$/.test(String(token).trim());
};

/**
 * Validate backup code format — 8 hex chars
 */
const isValidBackupCodeFormat = (code) => {
  if (!code) return false;
  return /^[a-f0-9]{8}$/i.test(String(code).trim());
};

/**
 * Verify TOTP with enhanced diagnostics and multiple tolerance levels.
 * If primary check fails, also tries wider tolerance as a diagnostic hint.
 */
const verifyTOTP = (secret, token, tolerance = TOTP_WINDOW) => {
  const cleanToken = String(token).trim();
  const serverEpoch = Math.floor(Date.now() / 1000);

  const diagnostics = {
    serverEpoch,
    serverTime: new Date().toISOString(),
    tokenLength: cleanToken.length,
    secretPresent: !!secret,
    secretLength: secret?.length || 0,
    tolerance,
    toleranceSeconds: tolerance * 30,
  };

  if (!secret) {
    return {
      valid: false,
      diagnostics: { ...diagnostics, error: "no_secret" },
    };
  }

  // Primary verification
  const result = verifySync({
    secret,
    token: cleanToken,
    epochTolerance: tolerance,
  });

  if (result.valid) {
    return {
      valid: true,
      delta: result.delta,
      epoch: result.epoch,
      diagnostics,
    };
  }

  // Dev-only: log the expected code for debugging
  if (process.env.NODE_ENV === "development") {
    try {
      const expectedCode = generateSync({ secret });
      diagnostics.expectedCode = expectedCode;
      diagnostics.receivedCode = cleanToken;
      diagnostics.codesMatch = expectedCode === cleanToken;
    } catch (e) {
      diagnostics.codeGenError = e.message;
    }
  }

  // Check with wider tolerance to detect time drift
  const wideResult = verifySync({
    secret,
    token: cleanToken,
    epochTolerance: 10,
  });
  if (wideResult.valid) {
    diagnostics.wouldPassWithWiderTolerance = true;
    diagnostics.clockDriftSteps = wideResult.delta;
    diagnostics.clockDriftSeconds = (wideResult.delta || 0) * 30;
  }

  return { valid: false, diagnostics };
};

/**
 * Check if user's 2FA is locked due to too many failed attempts
 */
const is2FALocked = (user) => {
  if (!user.twoFactorLockUntil) return false;
  if (new Date(user.twoFactorLockUntil).getTime() > Date.now()) return true;
  return false;
};

/**
 * Track failed 2FA attempt — lock if threshold exceeded
 */
const trackFailed2FA = async (user) => {
  const attempts = (user.twoFactorAttempts || 0) + 1;
  const update = { twoFactorAttempts: attempts };

  if (attempts >= MAX_2FA_ATTEMPTS) {
    update.twoFactorLockUntil = new Date(
      Date.now() + LOCK_2FA_MINUTES * 60 * 1000,
    );
    logger.warn(
      `[ADMIN_AUTH] 2FA locked for ${user.email} after ${attempts} failed attempts`,
    );
  }

  await User.findByIdAndUpdate(user._id, { $set: update });
  return { attempts, locked: attempts >= MAX_2FA_ATTEMPTS };
};

/**
 * Reset 2FA attempt counter on success
 */
const reset2FAAttempts = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    $set: { twoFactorAttempts: 0 },
    $unset: { twoFactorLockUntil: 1 },
  });
};

// ════════════════════════════════════════════════════════════
// ADMIN LOGIN — Step 1: Credentials
// ════════════════════════════════════════════════════════════
exports.adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip || req.connection?.remoteAddress;
  const ua = req.get("user-agent") || "unknown";

  if (!email || !password) {
    logAdminAuthEvent("LOGIN_INVALID_INPUT", { ip, ua });
    throw ApiError.badRequest("Email and password are required");
  }

  // Find user — include password + 2FA fields
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password +twoFactorEnabled +twoFactorSecret",
  );

  // Generic 404 for all failure cases (don't reveal user existence)
  if (!user) {
    logAdminAuthEvent("LOGIN_FAILED_NO_USER", {
      ip,
      ua,
      email: email.toLowerCase(),
    });
    throw ApiError.notFound("Resource not found");
  }

  if (!["admin", "superadmin"].includes(user.role)) {
    logAdminAuthEvent("LOGIN_FAILED_NOT_ADMIN", {
      ip,
      ua,
      email: email.toLowerCase(),
    });
    throw ApiError.notFound("Resource not found");
  }

  // Check account lock (password brute-force protection)
  if (user.isLocked()) {
    logAdminAuthEvent("LOGIN_BLOCKED_LOCKED", { ip, ua, email: user.email });
    throw ApiError.tooManyRequests(
      "Account temporarily locked. Try again later.",
    );
  }

  if (user.isBlocked) {
    logAdminAuthEvent("LOGIN_BLOCKED_BANNED", { ip, ua, email: user.email });
    throw ApiError.notFound("Resource not found");
  }

  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incrementLoginAttempts();
    logAdminAuthEvent("LOGIN_FAILED_BAD_PASSWORD", {
      ip,
      ua,
      email: user.email,
      attempts: user.loginAttempts + 1,
    });
    throw ApiError.notFound("Resource not found");
  }

  // Reset login attempts on successful password
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  await user.save({ validateBeforeSave: false });

  logAdminAuthEvent("LOGIN_CREDENTIALS_OK", {
    ip,
    ua,
    email: user.email,
    userId: user._id.toString(),
  });

  // ── 2FA BYPASSED FOR INTERNAL TESTING ──
  // TODO: Re-enable 2FA after internal testing is complete
  // Uncomment the 2FA block below and remove the direct-login block
  {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Frontend manages tokens via js-cookie — do NOT set/clear any cookies here.

    logAdminAuthEvent("LOGIN_SUCCESS_NO_2FA", {
      ip,
      email: user.email,
      userId: user._id.toString(),
      note: "2FA bypassed for testing",
    });

    return ApiResponse.success(
      res,
      {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
      },
      "Admin login successful",
    );
  }

  /*
  // ── 2FA is ALWAYS required for admin ──
  if (user.twoFactorEnabled && user.twoFactorSecret) {
    // Returning admin → challenge with TOTP
    const tempToken = jwt.sign(
      { id: user._id, purpose: "admin-2fa" },
      process.env.JWT_SECRET + JWT_2FA_KEY_SUFFIX,
      { expiresIn: TEMP_TOKEN_EXPIRY_2FA },
    );

    logAdminAuthEvent("2FA_CHALLENGE_ISSUED", { ip, email: user.email });

    return ApiResponse.success(
      res,
      {
        requires2FA: true,
        tempToken,
        twoFactorEnabled: true,
      },
      "Two-factor authentication required",
    );
  }

  // 2FA not yet set up → force setup
  const tempToken = jwt.sign(
    { id: user._id, purpose: "admin-2fa-setup" },
    process.env.JWT_SECRET + JWT_2FA_KEY_SUFFIX,
    { expiresIn: TEMP_TOKEN_EXPIRY_SETUP },
  );

  logAdminAuthEvent("2FA_SETUP_REQUIRED", { ip, email: user.email });

  return ApiResponse.success(
    res,
    {
      requires2FA: true,
      tempToken,
      twoFactorEnabled: false,
      message: "Two-factor authentication must be set up before admin access.",
    },
    "2FA setup required for admin access",
  );
  */
});

// ════════════════════════════════════════════════════════════
// ADMIN 2FA VERIFY — Step 2: TOTP code (returning admins)
// ════════════════════════════════════════════════════════════
exports.adminVerify2FA = asyncHandler(async (req, res) => {
  const { tempToken, token, backupCode } = req.body;
  const ip = req.ip || req.connection?.remoteAddress;

  if (!tempToken) {
    throw ApiError.notFound("Resource not found");
  }
  if (!token && !backupCode) {
    throw ApiError.badRequest("Verification code or backup code is required");
  }

  // Validate input format before any DB work
  if (token && !isValidTOTPFormat(token)) {
    throw ApiError.badRequest("Code must be exactly 6 digits");
  }
  if (backupCode && !isValidBackupCodeFormat(backupCode)) {
    throw ApiError.badRequest("Invalid backup code format");
  }

  // Verify temp JWT
  let decoded;
  try {
    decoded = jwt.verify(
      tempToken,
      process.env.JWT_SECRET + JWT_2FA_KEY_SUFFIX,
    );
  } catch (err) {
    logAdminAuthEvent("2FA_VERIFY_TOKEN_EXPIRED", { ip, error: err.message });
    throw ApiError.unauthorized("Session expired. Please login again.");
  }

  if (decoded.purpose !== "admin-2fa") {
    throw ApiError.notFound("Resource not found");
  }

  const user = await User.findById(decoded.id).select(
    "+twoFactorSecret +twoFactorBackupCodes +twoFactorAttempts +twoFactorLockUntil +lastUsedTOTPEpoch",
  );
  if (!user || !["admin", "superadmin"].includes(user.role)) {
    throw ApiError.notFound("Resource not found");
  }

  // Check 2FA attempt lockout
  if (is2FALocked(user)) {
    logAdminAuthEvent("2FA_VERIFY_LOCKED", { ip, email: user.email });
    throw ApiError.tooManyRequests(
      `Too many failed attempts. Try again in ${LOCK_2FA_MINUTES} minutes.`,
    );
  }

  // Verify secret exists in DB
  if (!user.twoFactorSecret) {
    logAdminAuthEvent("2FA_VERIFY_NO_SECRET", { ip, email: user.email });
    throw ApiError.badRequest(
      "2FA is not properly configured. Please contact support.",
    );
  }

  let verified = false;
  let verifyMethod = "unknown";

  if (token) {
    verifyMethod = "totp";
    const result = verifyTOTP(user.twoFactorSecret, token, TOTP_WINDOW);

    logger.info("[ADMIN_2FA_VERIFY]", {
      email: user.email,
      valid: result.valid,
      delta: result.delta,
      diagnostics: result.diagnostics,
    });

    if (result.valid) {
      // TOTP replay prevention — reject reused epoch
      if (
        user.lastUsedTOTPEpoch &&
        result.epoch &&
        result.epoch <= user.lastUsedTOTPEpoch
      ) {
        logAdminAuthEvent("2FA_VERIFY_REPLAY", {
          ip,
          email: user.email,
          epoch: result.epoch,
        });
        throw ApiError.unauthorized(
          "This code has already been used. Wait for a new code.",
        );
      }
      verified = true;
      user.lastUsedTOTPEpoch = result.epoch;
    }
  } else if (backupCode) {
    verifyMethod = "backup";
    const hashedCode = crypto
      .createHash("sha256")
      .update(String(backupCode).trim().toLowerCase())
      .digest("hex");
    const codes = user.twoFactorBackupCodes || [];
    const codeIndex = codes.indexOf(hashedCode);
    if (codeIndex !== -1) {
      user.twoFactorBackupCodes.splice(codeIndex, 1);
      verified = true;

      const remaining = user.twoFactorBackupCodes.length;
      if (remaining <= 2) {
        logger.warn(
          `[ADMIN_AUTH] ${user.email} only has ${remaining} backup codes left`,
        );
      }
    }
  }

  if (!verified) {
    const { attempts, locked } = await trackFailed2FA(user);
    logAdminAuthEvent("2FA_VERIFY_FAILED", {
      ip,
      email: user.email,
      method: verifyMethod,
      attempts,
      locked,
    });

    if (locked) {
      throw ApiError.tooManyRequests(
        `Too many failed attempts. Account locked for ${LOCK_2FA_MINUTES} minutes.`,
      );
    }

    const remaining = MAX_2FA_ATTEMPTS - attempts;
    if (verifyMethod === "totp") {
      throw ApiError.unauthorized(
        `Invalid verification code. Ensure your authenticator app time is synced. ${remaining <= 3 ? remaining + " attempts remaining." : ""}`,
      );
    }
    throw ApiError.unauthorized(
      `Invalid backup code. Codes are single-use and case-insensitive. ${remaining <= 3 ? remaining + " attempts remaining." : ""}`,
    );
  }

  // ── Success — issue real tokens ──
  await reset2FAAttempts(user._id);

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  setAdminTokenCookies(res, accessToken, refreshToken);

  logAdminAuthEvent("LOGIN_SUCCESS", {
    ip,
    email: user.email,
    userId: user._id.toString(),
    method: verifyMethod,
  });

  return ApiResponse.success(
    res,
    {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    },
    "Admin login successful",
  );
});

// ════════════════════════════════════════════════════════════
// ADMIN 2FA SETUP — First-time setup (get QR code)
// ════════════════════════════════════════════════════════════
exports.adminSetup2FA = asyncHandler(async (req, res) => {
  const { tempToken } = req.body;
  const ip = req.ip || req.connection?.remoteAddress;

  if (!tempToken) {
    throw ApiError.notFound("Resource not found");
  }

  let decoded;
  try {
    decoded = jwt.verify(
      tempToken,
      process.env.JWT_SECRET + JWT_2FA_KEY_SUFFIX,
    );
  } catch {
    throw ApiError.unauthorized("Session expired. Please login again.");
  }

  if (decoded.purpose !== "admin-2fa-setup") {
    throw ApiError.notFound("Resource not found");
  }

  const user = await User.findById(decoded.id).select(
    "+twoFactorSecret +twoFactorEnabled",
  );
  if (!user || !["admin", "superadmin"].includes(user.role)) {
    throw ApiError.notFound("Resource not found");
  }

  // Guard: don't allow re-setup if already enabled
  if (user.twoFactorEnabled) {
    throw ApiError.badRequest(
      "2FA is already enabled. Disable it first to re-setup.",
    );
  }

  const QRCode = require("qrcode");

  // IDEMPOTENT: reuse existing secret if one was already generated in this session.
  // This prevents the bug where React double-renders (StrictMode) or the user
  // refreshes the page — the QR code displayed would use secret #1, but
  // a second /setup-2fa call would overwrite the DB with secret #2.
  let secret = user.twoFactorSecret;
  if (!secret) {
    secret = generateSecret();
    user.twoFactorSecret = secret;
    await user.save({ validateBeforeSave: false });

    // Verify persistence — if the secret didn't save, the confirm step will always fail
    const verify = await User.findById(user._id)
      .select("+twoFactorSecret")
      .lean();
    if (verify.twoFactorSecret !== secret) {
      logger.error("[ADMIN_2FA_SETUP] Secret persistence FAILED!", {
        email: user.email,
        savedLength: verify.twoFactorSecret?.length,
        expectedLength: secret.length,
      });
      throw ApiError.internal(
        "Failed to save 2FA configuration. Please try again.",
      );
    }
  } else {
    logger.info("[ADMIN_2FA_SETUP] Reusing existing secret (idempotent)", {
      email: user.email,
    });
  }

  // Generate QR code
  const otpAuthUrl = generateURI({
    strategy: "totp",
    secret,
    issuer: "SAVA CROCHETS Admin",
    label: user.email,
  });
  const qrCode = await QRCode.toDataURL(otpAuthUrl);

  logger.info("[ADMIN_2FA_SETUP]", {
    email: user.email,
    secretPrefix: secret.substring(0, 8),
    secretLength: secret.length,
    wasReused: !!user.twoFactorSecret && user.twoFactorSecret === secret,
    serverEpoch: Math.floor(Date.now() / 1000),
    serverTime: new Date().toISOString(),
  });

  return ApiResponse.success(
    res,
    {
      secret, // Show for manual entry fallback
      qrCode,
      tempToken, // Pass back so frontend preserves it
      serverTime: new Date().toISOString(), // Time sync hint
    },
    "Scan the QR code with your authenticator app, then enter the 6-digit code.",
  );
});

// ════════════════════════════════════════════════════════════
// ADMIN 2FA CONFIRM SETUP — Verify first code & enable
// ════════════════════════════════════════════════════════════
exports.adminConfirmSetup2FA = asyncHandler(async (req, res) => {
  const { tempToken, token } = req.body;
  const ip = req.ip || req.connection?.remoteAddress;

  if (!tempToken) {
    throw ApiError.notFound("Resource not found");
  }
  if (!token) {
    throw ApiError.badRequest("Verification code is required");
  }

  // Validate format first — fast fail
  if (!isValidTOTPFormat(token)) {
    throw ApiError.badRequest("Code must be exactly 6 digits (e.g., 123456)");
  }

  let decoded;
  try {
    decoded = jwt.verify(
      tempToken,
      process.env.JWT_SECRET + JWT_2FA_KEY_SUFFIX,
    );
  } catch (err) {
    logAdminAuthEvent("2FA_SETUP_TOKEN_EXPIRED", { ip, error: err.message });
    throw ApiError.unauthorized(
      "Session expired. Please login again and restart 2FA setup.",
    );
  }

  if (decoded.purpose !== "admin-2fa-setup") {
    throw ApiError.notFound("Resource not found");
  }

  const user = await User.findById(decoded.id).select(
    "+twoFactorSecret +twoFactorBackupCodes +twoFactorEnabled +twoFactorAttempts +twoFactorLockUntil",
  );
  if (!user || !["admin", "superadmin"].includes(user.role)) {
    throw ApiError.notFound("Resource not found");
  }

  // Double-submit guard
  if (user.twoFactorEnabled) {
    throw ApiError.badRequest("2FA is already enabled on this account.");
  }

  // Check 2FA attempt lockout
  if (is2FALocked(user)) {
    throw ApiError.tooManyRequests(
      `Too many failed attempts. Try again in ${LOCK_2FA_MINUTES} minutes.`,
    );
  }

  // Ensure secret was set during the setup step
  if (!user.twoFactorSecret) {
    logAdminAuthEvent("2FA_CONFIRM_NO_SECRET", { ip, email: user.email });
    throw ApiError.badRequest(
      "2FA setup was not initiated properly. Please login again.",
    );
  }

  // Double-check: read secret directly from DB to detect any mongoose transform issues
  const dbCheck = await User.findById(user._id)
    .select("+twoFactorSecret")
    .lean();
  logger.info("[ADMIN_2FA_CONFIRM_SECRET_CHECK]", {
    email: user.email,
    secretFromQuery: user.twoFactorSecret?.substring(0, 8) + "...",
    secretFromDB: dbCheck.twoFactorSecret?.substring(0, 8) + "...",
    secretsMatch: user.twoFactorSecret === dbCheck.twoFactorSecret,
    secretLength: user.twoFactorSecret?.length,
  });

  // ── Verify TOTP code (wider tolerance for first-time setup) ──
  const result = verifyTOTP(user.twoFactorSecret, token, TOTP_SETUP_WINDOW);

  logger.info("[ADMIN_2FA_CONFIRM]", {
    email: user.email,
    valid: result.valid,
    delta: result.delta,
    diagnostics: result.diagnostics,
  });

  if (!result.valid) {
    const { attempts, locked } = await trackFailed2FA(user);

    logAdminAuthEvent("2FA_SETUP_CONFIRM_FAILED", {
      ip,
      email: user.email,
      attempts,
      locked,
      diagnostics: result.diagnostics,
    });

    if (locked) {
      throw ApiError.tooManyRequests(
        `Too many failed attempts. Try again in ${LOCK_2FA_MINUTES} minutes.`,
      );
    }

    // Build helpful error message
    const remaining = MAX_2FA_ATTEMPTS - attempts;
    let errorMsg = "Invalid verification code.";

    if (process.env.NODE_ENV === "development" && result.diagnostics) {
      const d = result.diagnostics;
      errorMsg += ` [DEV DEBUG: server=${d.serverTime}, expected=${d.expectedCode || "??"}, received=${d.receivedCode || "??"}, tolerance=±${d.toleranceSeconds}s`;
      if (d.wouldPassWithWiderTolerance) {
        errorMsg += `, clockDrift=${d.clockDriftSeconds}s — YOUR CLOCK IS OFF`;
      }
      errorMsg += `]`;
    } else {
      errorMsg +=
        " Make sure you enter the latest code from your authenticator app.";
      if (remaining <= 3) {
        errorMsg += ` ${remaining} attempts remaining.`;
      }
    }

    throw ApiError.unauthorized(errorMsg);
  }

  // ── Success — Enable 2FA ──
  await reset2FAAttempts(user._id);

  const backupCodes = generateBackupCodes();

  user.twoFactorEnabled = true;
  user.twoFactorBackupCodes = backupCodes.map((code) =>
    crypto.createHash("sha256").update(code).digest("hex"),
  );
  user.lastUsedTOTPEpoch = result.epoch || null;
  await user.save({ validateBeforeSave: false });

  // Issue real tokens — admin is now fully authenticated
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  setAdminTokenCookies(res, accessToken, refreshToken);

  logAdminAuthEvent("2FA_SETUP_COMPLETE_LOGIN_SUCCESS", {
    ip,
    email: user.email,
    userId: user._id.toString(),
  });

  return ApiResponse.success(
    res,
    {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
      backupCodes, // Show ONCE — must be saved by admin
    },
    "2FA enabled and admin login successful. Save your backup codes!",
  );
});

// ════════════════════════════════════════════════════════════
// ADMIN 2FA TIME SYNC CHECK — Diagnostic endpoint
// ════════════════════════════════════════════════════════════
exports.adminCheck2FASync = asyncHandler(async (req, res) => {
  const serverEpoch = Math.floor(Date.now() / 1000);
  const secondsRemaining = 30 - (serverEpoch % 30);

  return ApiResponse.success(
    res,
    {
      serverEpoch,
      serverTime: new Date().toISOString(),
      totpStep: Math.floor(serverEpoch / 30),
      secondsRemaining,
      toleranceWindow: `±${TOTP_WINDOW * 30}s`,
      setupToleranceWindow: `±${TOTP_SETUP_WINDOW * 30}s`,
      hint: "Your authenticator app's time must be within the tolerance window of the server time.",
    },
    "Server time sync info",
  );
});
