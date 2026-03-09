module.exports = {
  // User roles
  ROLES: {
    USER: "user",
    ADMIN: "admin",
    SUPERADMIN: "superadmin",
  },

  // Order statuses
  ORDER_STATUS: {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    PROCESSING: "processing",
    SHIPPED: "shipped",
    OUT_FOR_DELIVERY: "out_for_delivery",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
    RETURNED: "returned",
    REFUNDED: "refunded",
  },

  // Reservation statuses
  RESERVATION_STATUS: {
    PENDING: "pending",
    UNDER_REVIEW: "under_review",
    APPROVED: "approved",
    REJECTED: "rejected",
    IN_PRODUCTION: "in_production",
    QUALITY_CHECK: "quality_check",
    READY: "ready",
    SHIPPED: "shipped",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
  },

  // Payment statuses
  PAYMENT_STATUS: {
    INITIATED: "initiated",
    PENDING: "pending",
    COMPLETED: "completed",
    FAILED: "failed",
    REFUNDED: "refunded",
    PARTIALLY_REFUNDED: "partially_refunded",
  },

  // Product categories
  CATEGORIES: [
    "amigurumi",
    "clothing",
    "accessories",
    "home-decor",
    "bags",
    "toys",
    "baby-items",
    "jewelry",
    "gifts",
    "seasonal",
    "other",
  ],

  // Cache TTLs (seconds)
  CACHE_TTL: {
    PRODUCTS: 300, // 5 min
    PRODUCT_DETAIL: 600, // 10 min
    CATEGORIES: 3600, // 1 hr
    USER_PROFILE: 300, // 5 min
    ANALYTICS: 30, // 30 seconds — enables near real-time dashboard
    VISITOR_STATS: 60, // 1 min
    RECOMMENDATIONS: 600, // 10 min — smart product recommendations
  },

  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 12,
    MAX_LIMIT: 100,
  },

  // File upload limits
  UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_FILES: 5,
    ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
};
