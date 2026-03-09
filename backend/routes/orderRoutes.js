const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  createOrderValidator,
  updateOrderStatusValidator,
} = require("../validators/orderValidator");
const { paymentLimiter } = require("../middleware/rateLimiter");

// All order routes require authentication
router.use(protect);

router.post(
  "/",
  paymentLimiter,
  createOrderValidator,
  validate,
  orderController.createOrder,
);
router.get("/", orderController.getMyOrders);
router.get("/:id", orderController.getOrder);
router.post("/:id/cancel", orderController.cancelOrder);
router.get("/:id/track", orderController.trackOrder);

module.exports = router;
