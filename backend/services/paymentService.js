const crypto = require("crypto");
const { getRazorpay } = require("../config/razorpay");
// const { getStripe } = require('../config/stripe'); // Stripe disabled — using Razorpay only
const Payment = require("../models/Payment");
const logger = require("../utils/logger");
const ApiError = require("../utils/ApiError");

class PaymentService {
  // ─── RAZORPAY ────────────────────────────────────────────

  /**
   * Create Razorpay order
   */
  async createRazorpayOrder({ amount, currency = "INR", receipt, notes = {} }) {
    const razorpay = getRazorpay();
    if (!razorpay) throw ApiError.internal("Razorpay not configured");

    const options = {
      amount: Math.round(amount * 100), // paise
      currency,
      receipt,
      notes,
    };

    const order = await razorpay.orders.create(options);
    logger.info(`Razorpay order created: ${order.id}`);
    return order;
  }

  /**
   * Verify Razorpay payment signature
   */
  verifyRazorpaySignature({ orderId, paymentId, signature }) {
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    return expectedSignature === signature;
  }

  /**
   * Fetch Razorpay payment details
   */
  async fetchRazorpayPayment(paymentId) {
    const razorpay = getRazorpay();
    return razorpay.payments.fetch(paymentId);
  }

  /**
   * Process Razorpay refund
   */
  async processRazorpayRefund(paymentId, amount, notes = {}) {
    const razorpay = getRazorpay();
    const refund = await razorpay.payments.refund(paymentId, {
      amount: Math.round(amount * 100),
      notes,
    });
    logger.info(`Razorpay refund processed: ${refund.id}`);
    return refund;
  }

  // ─── STRIPE (DISABLED — using Razorpay only) ────────────
  // All Stripe methods commented out. Uncomment to re-enable.
  //
  // async createStripeSession({ items, customer, metadata, successUrl, cancelUrl }) {
  //   const stripe = getStripe();
  //   if (!stripe) throw ApiError.internal('Stripe not configured');
  //   const lineItems = items.map((item) => ({
  //     price_data: {
  //       currency: 'inr',
  //       product_data: { name: item.productName, images: item.image ? [item.image] : [] },
  //       unit_amount: Math.round(item.price * 100),
  //     },
  //     quantity: item.quantity,
  //   }));
  //   const session = await stripe.checkout.sessions.create({
  //     payment_method_types: ['card'],
  //     line_items: lineItems,
  //     mode: 'payment',
  //     customer_email: customer.email,
  //     metadata,
  //     success_url: successUrl,
  //     cancel_url: cancelUrl,
  //   });
  //   logger.info(`Stripe session created: ${session.id}`);
  //   return session;
  // }
  //
  // verifyStripeWebhook(payload, signature) {
  //   const stripe = getStripe();
  //   return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
  // }
  //
  // async processStripeRefund(paymentIntentId, amount) {
  //   const stripe = getStripe();
  //   const refund = await stripe.refunds.create({ payment_intent: paymentIntentId, amount: Math.round(amount * 100) });
  //   logger.info(`Stripe refund processed: ${refund.id}`);
  //   return refund;
  // }

  // ─── PAYMENT LOGGING ────────────────────────────────────

  /**
   * Create payment log
   */
  async createPaymentLog({
    order,
    reservation,
    user,
    gateway,
    gatewayOrderId,
    amount,
    currency,
  }) {
    return Payment.create({
      order,
      reservation,
      user,
      gateway,
      gatewayOrderId,
      amount,
      currency: currency || "INR",
      status: "initiated",
    });
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(paymentId, updates) {
    return Payment.findByIdAndUpdate(paymentId, updates, { new: true });
  }
}

module.exports = new PaymentService();
