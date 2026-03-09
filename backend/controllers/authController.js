const crypto = require("crypto");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { sanitizeUser } = require("../utils/helpers");
const emailService = require("../services/emailService");

/**
 * Server no longer sets or clears httpOnly cookies for access/refresh tokens.
 * The frontend manages tokens entirely via js-cookie (non-httpOnly) and sends
 * them as Authorization: Bearer headers.  Any server-side Set-Cookie for these
 * names would destroy the frontend's cookies, so we intentionally do nothing.
 */
const setTokenCookies = (/* res, accessToken, refreshToken */) => {
  // NO-OP: frontend manages tokens via js-cookie.
  // Do NOT set or clear cookies named accessToken/refreshToken here.
};

// ─── REGISTER ──────────────────────────────────────────────
exports.register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict("User with this email already exists");
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
  });

  // Generate email verification token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send verification email (non-blocking)
  emailService.sendVerificationEmail(user, verificationToken).catch(() => {});

  // Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  setTokenCookies(res, accessToken, refreshToken);

  return ApiResponse.created(
    res,
    {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    },
    "Registration successful. Please verify your email.",
  );
});

// ─── LOGIN ─────────────────────────────────────────────────
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select(
    "+password +twoFactorEnabled",
  );
  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  // Check if account is locked
  if (user.isLocked()) {
    throw ApiError.tooManyRequests(
      "Account temporarily locked due to too many failed attempts. Try again in 30 minutes.",
    );
  }

  // Check if blocked
  if (user.isBlocked) {
    throw ApiError.forbidden("Your account has been blocked. Contact support.");
  }

  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incrementLoginAttempts();
    throw ApiError.unauthorized("Invalid email or password");
  }

  // Reset login attempts on successful password verification
  user.loginAttempts = 0;
  user.lockUntil = undefined;

  // ── 2FA Challenge ──
  // If user has 2FA enabled, issue a short-lived temp token and require TOTP
  if (user.twoFactorEnabled) {
    await user.save({ validateBeforeSave: false });
    const jwt = require("jsonwebtoken");
    const tempToken = jwt.sign(
      { id: user._id, purpose: "2fa" },
      process.env.JWT_SECRET + ":2fa",
      { expiresIn: "5m" }, // 5-minute window to enter TOTP
    );

    return ApiResponse.success(
      res,
      {
        requires2FA: true,
        tempToken,
      },
      "Two-factor authentication required",
    );
  }

  // ── Normal login (no 2FA) ──
  user.lastLogin = new Date();

  // Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  setTokenCookies(res, accessToken, refreshToken);

  return ApiResponse.success(
    res,
    {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    },
    "Login successful",
  );
});

// ─── LOGOUT ────────────────────────────────────────────────
exports.logout = asyncHandler(async (req, res) => {
  // Clear refresh token in DB
  await User.findByIdAndUpdate(req.user._id, { refreshToken: "" });

  // Clear cookies (must match path used when setting)
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/api/auth" });

  return ApiResponse.success(res, null, "Logged out successfully");
});

// ─── REFRESH TOKEN ─────────────────────────────────────────
exports.refreshToken = asyncHandler(async (req, res) => {
  // Prefer body token over cookies — stale httpOnly cookies may contain old values
  const token = req.body.refreshToken || req.cookies?.refreshToken;
  if (!token) {
    throw ApiError.unauthorized("Refresh token not provided");
  }

  const jwt = require("jsonwebtoken");
  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id);

  if (!user || user.refreshToken !== token) {
    throw ApiError.unauthorized("Invalid refresh token");
  }

  const accessToken = user.generateAccessToken();
  const newRefreshToken = user.generateRefreshToken();
  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  setTokenCookies(res, accessToken, newRefreshToken);

  return ApiResponse.success(
    res,
    { accessToken, refreshToken: newRefreshToken },
    "Token refreshed",
  );
});

// ─── VERIFY EMAIL ──────────────────────────────────────────
exports.verifyEmail = asyncHandler(async (req, res) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw ApiError.badRequest("Invalid or expired verification token");
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });

  return ApiResponse.success(res, null, "Email verified successfully");
});

// ─── FORGOT PASSWORD ───────────────────────────────────────
exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    // Don't reveal whether a user exists
    return ApiResponse.success(
      res,
      null,
      "If the email exists, a password reset link has been sent.",
    );
  }

  const resetToken = user.generateResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  try {
    await emailService.sendPasswordResetEmail(user, resetToken);
  } catch {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    throw ApiError.internal("Email could not be sent");
  }

  return ApiResponse.success(
    res,
    null,
    "If the email exists, a password reset link has been sent.",
  );
});

// ─── RESET PASSWORD ────────────────────────────────────────
exports.resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw ApiError.badRequest("Invalid or expired reset token");
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.refreshToken = ""; // Invalidate all sessions
  await user.save();

  return ApiResponse.success(
    res,
    null,
    "Password reset successful. Please login with your new password.",
  );
});

// ─── CHANGE PASSWORD ───────────────────────────────────────
exports.changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+password");

  const isMatch = await user.comparePassword(req.body.currentPassword);
  if (!isMatch) {
    throw ApiError.unauthorized("Current password is incorrect");
  }

  user.password = req.body.newPassword;
  user.refreshToken = ""; // Invalidate old sessions
  await user.save();

  // Generate new tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  setTokenCookies(res, accessToken, refreshToken);

  return ApiResponse.success(
    res,
    { accessToken },
    "Password changed successfully",
  );
});

// ─── GET CURRENT USER ──────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  return ApiResponse.success(res, { user: sanitizeUser(user) });
});

// Export setTokenCookies for use by 2FA controller
exports.setTokenCookies = setTokenCookies;
