const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const analyticsController = require("../controllers/analyticsController");
const { adminProtect, adminAuthorize } = require("../middleware/auth");
const { adminLimiter } = require("../middleware/rateLimiter");
const auditLogger = require("../middleware/auditLogger");
const validate = require("../middleware/validate");
const { updateOrderStatusValidator } = require("../validators/orderValidator");
const {
  updateReservationStatusValidator,
} = require("../validators/reservationValidator");

// All admin routes: rate-limit → auth (returns 404 for non-admins) → audit log
router.use(adminLimiter);
router.use(adminProtect);
router.use(adminAuthorize);
router.use(auditLogger);

// User management
router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUserById);
router.patch("/users/:id/block", adminController.blockUser);

// Order management
router.get("/orders", adminController.getAllOrders);
router.get("/orders/:id", adminController.getOrderById);
router.patch(
  "/orders/:id/status",
  updateOrderStatusValidator,
  validate,
  adminController.updateOrderStatus,
);

// Inventory management
router.get("/inventory", adminController.getInventory);
router.patch("/inventory/:productId", adminController.updateStock);

// Reservation management
router.get("/reservations", adminController.getAllReservations);
router.patch(
  "/reservations/:id/status",
  updateReservationStatusValidator,
  validate,
  adminController.updateReservationStatus,
);

// Coupon management
router.post("/coupons", adminController.createCoupon);
router.get("/coupons", adminController.getAllCoupons);
router.put("/coupons/:id", adminController.updateCoupon);
router.delete("/coupons/:id", adminController.deleteCoupon);

// Payment logs
router.get("/payments", adminController.getPaymentLogs);
router.post("/payments/:paymentId/refund", adminController.adminRefundPayment);

// Analytics
router.get("/analytics/dashboard", analyticsController.getDashboard);
router.get("/analytics/revenue", analyticsController.getRevenueAnalytics);
router.get("/analytics/sales", analyticsController.getSalesAnalytics);
router.get("/analytics/products", analyticsController.getProductsAnalytics);
router.get("/analytics/customers", analyticsController.getCustomersAnalytics);
router.get("/analytics/most-sold", analyticsController.getMostSoldProducts);
router.get(
  "/analytics/order-status",
  analyticsController.getOrderStatusDistribution,
);
router.get(
  "/analytics/user-trend",
  analyticsController.getUserRegistrationTrend,
);
router.get("/analytics/category-sales", analyticsController.getCategorySales);
router.get("/analytics/visitors", analyticsController.getVisitorStats);
router.get("/analytics/most-viewed", analyticsController.getMostViewedProducts);
router.get(
  "/analytics/returning-customers",
  analyticsController.getReturningCustomerStats,
);

module.exports = router;
