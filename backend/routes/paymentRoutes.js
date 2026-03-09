const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");
const { paymentLimiter } = require("../middleware/rateLimiter");

// Stripe webhook disabled — using Razorpay only
// router.post('/stripe/webhook', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);

// Protected routes
router.post(
  "/razorpay/verify",
  protect,
  paymentLimiter,
  paymentController.verifyRazorpayPayment,
);
router.post(
  "/refund/:paymentId",
  protect,
  paymentLimiter,
  paymentController.processRefund,
);
router.get("/history", protect, paymentController.getPaymentHistory);

module.exports = router;
