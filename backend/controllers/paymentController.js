const Order = require("../models/Order");
const Product = require("../models/Product");
const Payment = require("../models/Payment");
const Coupon = require("../models/Coupon");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const paymentService = require("../services/paymentService");
const emailService = require("../services/emailService");
const logger = require("../utils/logger");

// ─── VERIFY RAZORPAY PAYMENT ───────────────────────────────
exports.verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  // Verify signature
  const isValid = paymentService.verifyRazorpaySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!isValid) {
    // Update payment log
    await Payment.findOneAndUpdate(
      { gatewayOrderId: razorpay_order_id },
      { status: "failed", failureReason: "Invalid signature" },
    );
    throw ApiError.badRequest("Payment verification failed");
  }

  // Fetch payment details from Razorpay
  const paymentDetails =
    await paymentService.fetchRazorpayPayment(razorpay_payment_id);

  // Update order
  const order = await Order.findOne({
    "paymentInfo.gatewayOrderId": razorpay_order_id,
  });
  if (!order) throw ApiError.notFound("Order not found");

  order.paymentInfo.transactionId = razorpay_payment_id;
  order.paymentInfo.status = "paid";
  order.paymentInfo.paidAt = new Date();
  order.status = "confirmed";
  order.statusHistory.push({
    status: "confirmed",
    note: `Payment confirmed via Razorpay: ${razorpay_payment_id}`,
  });
  await order.save();

  // Update payment log
  await Payment.findOneAndUpdate(
    { gatewayOrderId: razorpay_order_id },
    {
      gatewayPaymentId: razorpay_payment_id,
      gatewaySignature: razorpay_signature,
      status: "completed",
      metadata: paymentDetails,
    },
  );

  // Reduce stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity, sold: item.quantity },
    });
  }

  // Update coupon usage
  if (order.couponCode) {
    await Coupon.findOneAndUpdate(
      { code: order.couponCode },
      { $inc: { usedCount: 1 }, $push: { usedBy: { user: order.user } } },
    );
  }

  // Send confirmation email
  const User = require("../models/User");
  const user = await User.findById(order.user);
  if (user)
    emailService.sendOrderConfirmationEmail(user, order).catch(() => {});

  return ApiResponse.success(res, { order }, "Payment verified successfully");
});

// ─── STRIPE WEBHOOK (DISABLED — using Razorpay only) ──────
// Uncomment to re-enable Stripe webhook handling.
//
// exports.stripeWebhook = asyncHandler(async (req, res) => {
//   const signature = req.headers['stripe-signature'];
//   let event;
//   try {
//     event = paymentService.verifyStripeWebhook(req.body, signature);
//   } catch (err) {
//     logger.error(`Stripe webhook error: ${err.message}`);
//     return res.status(400).json({ error: 'Webhook verification failed' });
//   }
//   switch (event.type) {
//     case 'checkout.session.completed': { ... }
//     case 'payment_intent.payment_failed': { ... }
//     default: logger.info(`Unhandled Stripe event: ${event.type}`);
//   }
//   return res.status(200).json({ received: true });
// });

// ─── PROCESS REFUND ────────────────────────────────────────
exports.processRefund = asyncHandler(async (req, res) => {
  const { orderId, amount, reason } = req.body;

  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound("Order not found");

  if (order.paymentInfo.status !== "paid") {
    throw ApiError.badRequest("Order has not been paid");
  }

  const refundAmount = amount || order.totalAmount;
  let refund;

  if (order.paymentInfo.method === "razorpay") {
    refund = await paymentService.processRazorpayRefund(
      order.paymentInfo.transactionId,
      refundAmount,
      { reason, orderId: order._id.toString() },
    );
    // } else if (order.paymentInfo.method === 'stripe') {
    //   refund = await paymentService.processStripeRefund(
    //     order.paymentInfo.transactionId,
    //     refundAmount
    //   );
  } else {
    throw ApiError.badRequest("COD orders cannot be refunded online");
  }

  // Update order
  order.paymentInfo.status =
    amount && amount < order.totalAmount ? "partially_refunded" : "refunded";
  order.paymentInfo.refundId = refund.id;
  order.paymentInfo.refundAmount = refundAmount;
  order.paymentInfo.refundedAt = new Date();
  order.status = "refunded";
  order.statusHistory.push({
    status: "refunded",
    note: `Refund of ₹${refundAmount} processed. Reason: ${reason || "N/A"}`,
    updatedBy: req.user._id,
  });
  await order.save();

  // Update payment log
  await Payment.findOneAndUpdate(
    { order: orderId },
    {
      status: order.paymentInfo.status,
      $push: {
        refunds: {
          refundId: refund.id,
          amount: refundAmount,
          reason,
          status: "processed",
          processedAt: new Date(),
        },
      },
    },
  );

  return ApiResponse.success(res, { order, refund }, "Refund processed");
});

// ─── GET PAYMENT HISTORY ───────────────────────────────────
exports.getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id })
    .populate("order", "orderNumber totalAmount status")
    .sort({ createdAt: -1 })
    .lean();

  return ApiResponse.success(res, { payments });
});
