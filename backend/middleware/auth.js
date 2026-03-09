const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Protect routes - verify JWT token
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // Check cookies
  else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw ApiError.unauthorized("Access denied. No token provided.");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select(
      "-password -refreshToken",
    );

    if (!user) {
      throw ApiError.unauthorized("User not found. Token invalid.");
    }

    if (user.isBlocked) {
      throw ApiError.forbidden(
        "Your account has been blocked. Contact support.",
      );
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      throw ApiError.unauthorized("Invalid token");
    }
    if (error.name === "TokenExpiredError") {
      throw ApiError.unauthorized("Token expired. Please login again.");
    }
    throw error;
  }
});

/**
 * Optional auth - attach user if token exists, but don't block
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select(
        "-password -refreshToken",
      );
    } catch {
      // Token invalid - continue without user
    }
  }
  next();
});

/**
 * Authorize by role(s)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized("Access denied");
    }
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden(
        `Role '${req.user.role}' is not authorized to access this resource`,
      );
    }
    next();
  };
};

/**
 * Admin-only authorize — returns 404 instead of 403 to hide admin endpoints.
 * Unauthenticated or non-admin users get "Not Found" as if the route doesn't exist.
 */
const adminAuthorize = asyncHandler(async (req, res, next) => {
  // If protect middleware didn't attach a user (shouldn't happen if used after protect)
  if (!req.user) {
    throw ApiError.notFound("Resource not found");
  }
  if (!["admin", "superadmin"].includes(req.user.role)) {
    throw ApiError.notFound("Resource not found");
  }
  next();
});

/**
 * Protect middleware variant for admin routes — converts auth errors to 404
 * so non-authenticated users can't discover admin endpoints exist.
 */
const adminProtect = async (req, res, next) => {
  try {
    await new Promise((resolve, reject) => {
      protect(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    next();
  } catch {
    // Convert ANY auth error to 404 for admin routes
    next(ApiError.notFound("Resource not found"));
  }
};

module.exports = { protect, optionalAuth, authorize, adminProtect, adminAuthorize };
