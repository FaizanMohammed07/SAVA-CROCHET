const crypto = require("crypto");
const {
  generateSecret,
  generateURI,
  verifySync,
  generateSync,
} = require("otplib");
const QRCode = require("qrcode");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const logger = require("../utils/logger");

const APP_NAME = "SAVA CROCHETS";

// ─── Constants ─────────────────────────────────────────────
const TOTP_WINDOW = 3; // ±90 seconds clock drift tolerance
const TOTP_SETUP_WINDOW = 5; // ±150 seconds for first-time setup
const MAX_2FA_ATTEMPTS = 5; // Lock after 5 failed 2FA attempts
const LOCK_2FA_MINUTES = 15; // Lock 2FA for 15 minutes

/**
 * Generate 8 backup codes (each 8 hex chars)
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
 * Verify TOTP with enhanced diagnostics
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

  // Dev-only: show expected code
  if (process.env.NODE_ENV === "development") {
    try {
      diagnostics.expectedCode = generateSync({ secret });
      diagnostics.receivedCode = cleanToken;
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
    diagnostics.clockDriftSeconds = (wideResult.delta || 0) * 30;
  }

  return { valid: false, diagnostics };
};

/**
 * Check if user's 2FA is locked
 */
const is2FALocked = (user) => {
  if (!user.twoFactorLockUntil) return false;
  return new Date(user.twoFactorLockUntil).getTime() > Date.now();
};

/**
 * Track failed 2FA attempt
 */
const trackFailed2FA = async (user) => {
  const attempts = (user.twoFactorAttempts || 0) + 1;
  const update = { twoFactorAttempts: attempts };

  if (attempts >= MAX_2FA_ATTEMPTS) {
    update.twoFactorLockUntil = new Date(
      Date.now() + LOCK_2FA_MINUTES * 60 * 1000,
    );
  }

  await User.findByIdAndUpdate(user._id, { $set: update });
  return { attempts, locked: attempts >= MAX_2FA_ATTEMPTS };
};

/**
 * Reset 2FA attempt counter
 */
const reset2FAAttempts = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    $set: { twoFactorAttempts: 0 },
    $unset: { twoFactorLockUntil: 1 },
  });
};

// ─── SETUP 2FA — Generate secret + QR code ────────────────
exports.setup2FA = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "+twoFactorSecret +twoFactorEnabled",
  );

  if (user.twoFactorEnabled) {
    throw ApiError.badRequest("Two-factor authentication is already enabled");
  }

  // Generate TOTP secret
  const secret = generateSecret();

  // Store secret temporarily (not yet enabled until verified)
  user.twoFactorSecret = secret;
  await user.save({ validateBeforeSave: false });

  // Verify persistence
  const verify = await User.findById(user._id)
    .select("+twoFactorSecret")
    .lean();
  if (verify.twoFactorSecret !== secret) {
    logger.error("[2FA_SETUP] Secret persistence failed!", {
      email: user.email,
    });
    throw ApiError.internal(
      "Failed to save 2FA configuration. Please try again.",
    );
  }

  // Generate otpauth URI for authenticator apps
  const otpAuthUrl = generateURI({
    strategy: "totp",
    secret,
    issuer: APP_NAME,
    label: user.email,
  });

  // Generate QR code as data URL
  const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

  logger.info("[2FA_SETUP]", {
    email: user.email,
    secretLength: secret.length,
    serverTime: new Date().toISOString(),
  });

  return ApiResponse.success(
    res,
    {
      secret, // Show to user so they can manually enter if QR scan fails
      qrCode: qrCodeDataUrl,
      serverTime: new Date().toISOString(), // Time sync hint
    },
    "Scan the QR code with your authenticator app, then verify with a code.",
  );
});

// ─── VERIFY 2FA SETUP — Confirm TOTP works before enabling ─
exports.verifySetup2FA = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) {
    throw ApiError.badRequest("Verification token is required");
  }

  if (!isValidTOTPFormat(token)) {
    throw ApiError.badRequest("Code must be exactly 6 digits");
  }

  const user = await User.findById(req.user._id).select(
    "+twoFactorSecret +twoFactorBackupCodes +twoFactorAttempts +twoFactorLockUntil",
  );

  if (!user.twoFactorSecret) {
    throw ApiError.badRequest(
      "Please initiate 2FA setup first by calling setup endpoint",
    );
  }

  // Check lockout
  if (is2FALocked(user)) {
    throw ApiError.tooManyRequests(
      `Too many failed attempts. Try again in ${LOCK_2FA_MINUTES} minutes.`,
    );
  }

  // Verify the TOTP code — wider tolerance for setup flow
  const result = verifyTOTP(user.twoFactorSecret, token, TOTP_SETUP_WINDOW);

  logger.info("[2FA_VERIFY_SETUP]", {
    email: user.email,
    valid: result.valid,
    delta: result.delta,
    diagnostics: result.diagnostics,
  });

  if (!result.valid) {
    const { attempts, locked } = await trackFailed2FA(user);

    if (locked) {
      throw ApiError.tooManyRequests(
        `Too many failed attempts. Try again in ${LOCK_2FA_MINUTES} minutes.`,
      );
    }

    let errorMsg = "Invalid verification code.";
    if (process.env.NODE_ENV === "development" && result.diagnostics) {
      const d = result.diagnostics;
      errorMsg += ` [DEV: expected=${d.expectedCode || "??"}, received=${d.receivedCode || "??"}, tolerance=±${d.toleranceSeconds}s`;
      if (d.wouldPassWithWiderTolerance) {
        errorMsg += `, clockDrift=${d.clockDriftSeconds}s — CLOCK IS OFF`;
      }
      errorMsg += `]`;
    } else {
      errorMsg +=
        " Make sure you enter the latest code from your authenticator app.";
    }

    throw ApiError.unauthorized(errorMsg);
  }

  // Generate backup codes
  await reset2FAAttempts(user._id);
  const backupCodes = generateBackupCodes();

  // Enable 2FA and store hashed backup codes
  user.twoFactorEnabled = true;
  user.twoFactorBackupCodes = backupCodes.map((code) =>
    crypto.createHash("sha256").update(code).digest("hex"),
  );
  user.lastUsedTOTPEpoch = result.epoch || null;
  await user.save({ validateBeforeSave: false });

  return ApiResponse.success(
    res,
    {
      backupCodes, // Show ONCE — user must save these
    },
    "Two-factor authentication enabled successfully. Save your backup codes!",
  );
});

// ─── VERIFY 2FA LOGIN — Called after password auth ─────────
exports.verify2FALogin = asyncHandler(async (req, res) => {
  const { tempToken, token, backupCode } = req.body;

  if (!tempToken) {
    throw ApiError.badRequest("Temporary authentication token is required");
  }
  if (!token && !backupCode) {
    throw ApiError.badRequest(
      "Either a TOTP code or a backup code is required",
    );
  }

  // Validate input format
  if (token && !isValidTOTPFormat(token)) {
    throw ApiError.badRequest("Code must be exactly 6 digits");
  }

  // Verify the temporary token
  const jwt = require("jsonwebtoken");
  let decoded;
  try {
    decoded = jwt.verify(tempToken, process.env.JWT_SECRET + ":2fa");
  } catch {
    throw ApiError.unauthorized(
      "Invalid or expired temporary token. Please login again.",
    );
  }

  const user = await User.findById(decoded.id).select(
    "+twoFactorSecret +twoFactorBackupCodes +twoFactorAttempts +twoFactorLockUntil +lastUsedTOTPEpoch",
  );
  if (!user) {
    throw ApiError.unauthorized("User not found");
  }

  // Check lockout
  if (is2FALocked(user)) {
    throw ApiError.tooManyRequests(
      `Too many failed attempts. Try again in ${LOCK_2FA_MINUTES} minutes.`,
    );
  }

  if (!user.twoFactorSecret) {
    throw ApiError.badRequest(
      "2FA is not properly configured. Please contact support.",
    );
  }

  let verified = false;
  let verifyMethod = "unknown";

  if (token) {
    verifyMethod = "totp";
    const result = verifyTOTP(user.twoFactorSecret, token, TOTP_WINDOW);

    logger.info("[2FA_LOGIN_VERIFY]", {
      email: user.email,
      valid: result.valid,
      delta: result.delta,
      diagnostics: result.diagnostics,
    });

    if (result.valid) {
      // Replay prevention
      if (
        user.lastUsedTOTPEpoch &&
        result.epoch &&
        result.epoch <= user.lastUsedTOTPEpoch
      ) {
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
          `[2FA] ${user.email} only has ${remaining} backup codes left`,
        );
      }
    }
  }

  if (!verified) {
    const { attempts, locked } = await trackFailed2FA(user);

    if (locked) {
      throw ApiError.tooManyRequests(
        `Too many failed attempts. Try again in ${LOCK_2FA_MINUTES} minutes.`,
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

  // Set cookies
  const { setTokenCookies } = require("./authController");
  setTokenCookies(res, accessToken, refreshToken);

  const { sanitizeUser } = require("../utils/helpers");

  return ApiResponse.success(
    res,
    {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    },
    "Two-factor authentication verified. Login successful.",
  );
});

// ─── DISABLE 2FA ───────────────────────────────────────────
exports.disable2FA = asyncHandler(async (req, res) => {
  const { password, token } = req.body;

  if (!password) {
    throw ApiError.badRequest("Password is required to disable 2FA");
  }

  const user = await User.findById(req.user._id).select(
    "+password +twoFactorSecret +twoFactorEnabled +twoFactorBackupCodes",
  );

  if (!user.twoFactorEnabled) {
    throw ApiError.badRequest("Two-factor authentication is not enabled");
  }

  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized("Incorrect password");
  }

  // Verify TOTP code if provided (extra safety)
  if (token) {
    if (!isValidTOTPFormat(token)) {
      throw ApiError.badRequest("Code must be exactly 6 digits");
    }
    const result = verifyTOTP(user.twoFactorSecret, token, TOTP_WINDOW);
    if (!result.valid) {
      throw ApiError.unauthorized("Invalid 2FA code");
    }
  }

  // Disable 2FA — clear all 2FA data
  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  user.twoFactorBackupCodes = [];
  user.twoFactorAttempts = 0;
  user.twoFactorLockUntil = undefined;
  user.lastUsedTOTPEpoch = undefined;
  await user.save({ validateBeforeSave: false });

  logger.info("[2FA_DISABLED]", { email: user.email });

  return ApiResponse.success(
    res,
    null,
    "Two-factor authentication has been disabled.",
  );
});

// ─── REGENERATE BACKUP CODES ───────────────────────────────
exports.regenerateBackupCodes = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    throw ApiError.badRequest("Password is required");
  }

  const user = await User.findById(req.user._id).select(
    "+password +twoFactorEnabled +twoFactorBackupCodes",
  );

  if (!user.twoFactorEnabled) {
    throw ApiError.badRequest("Two-factor authentication is not enabled");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized("Incorrect password");
  }

  // Generate new backup codes
  const backupCodes = generateBackupCodes();
  user.twoFactorBackupCodes = backupCodes.map((code) =>
    crypto.createHash("sha256").update(code).digest("hex"),
  );
  await user.save({ validateBeforeSave: false });

  return ApiResponse.success(
    res,
    { backupCodes },
    "New backup codes generated. Old codes are now invalid.",
  );
});
