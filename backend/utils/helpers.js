/**
 * Utility helper functions
 */

/**
 * Build pagination object from query params
 */
const buildPagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 12));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Build pagination metadata for response
 */
const paginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Build sort object from query string
 */
const buildSortQuery = (sortStr) => {
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    "price-low": { price: 1 },
    "price-high": { price: -1 },
    popularity: { sold: -1 },
    rating: { "rating.average": -1 },
    name: { productName: 1 },
  };
  return sortMap[sortStr] || { createdAt: -1 };
};

/**
 * Build filter query from request params
 */
const buildProductFilter = (query) => {
  const filter = { isActive: true };

  if (query.category) filter.category = query.category;
  if (query.crochetType) filter.crochetType = query.crochetType;
  if (query.difficulty) filter.difficulty = query.difficulty;
  if (query.size) filter.size = query.size;

  if (query.color) {
    filter.colors = {
      $in: Array.isArray(query.color) ? query.color : [query.color],
    };
  }
  if (query.material) {
    filter.material = {
      $in: Array.isArray(query.material) ? query.material : [query.material],
    };
  }

  // Price range
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = parseFloat(query.minPrice);
    if (query.maxPrice) filter.price.$lte = parseFloat(query.maxPrice);
  }

  // Rating filter
  if (query.minRating) {
    filter["rating.average"] = { $gte: parseFloat(query.minRating) };
  }

  // In stock only
  if (query.inStock === "true") {
    filter.stock = { $gt: 0 };
  }

  // Featured
  if (query.featured === "true") {
    filter.isFeatured = true;
  }

  // Tags
  if (query.tags) {
    filter.tags = {
      $in: Array.isArray(query.tags) ? query.tags : [query.tags],
    };
  }

  return filter;
};

/**
 * Generate a random string
 */
const generateRandomString = (length = 16) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Sanitize user object for response (remove sensitive fields)
 */
const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.refreshToken;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpire;
  delete obj.twoFactorSecret;
  delete obj.twoFactorBackupCodes;
  delete obj.__v;
  return obj;
};

module.exports = {
  buildPagination,
  paginationMeta,
  buildSortQuery,
  buildProductFilter,
  generateRandomString,
  sanitizeUser,
};
