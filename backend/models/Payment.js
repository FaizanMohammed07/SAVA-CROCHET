const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      index: true,
    },
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    gateway: {
      type: String,
      enum: ["razorpay", "cod"], // 'stripe' removed — using Razorpay only
      required: true,
    },
    gatewayOrderId: String,
    gatewayPaymentId: String,
    gatewaySignature: String,
    // stripeSessionId: String,      // Stripe disabled
    // stripePaymentIntentId: String, // Stripe disabled
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: [
        "initiated",
        "pending",
        "completed",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      default: "initiated",
      index: true,
    },
    refunds: [
      {
        refundId: String,
        amount: Number,
        reason: String,
        status: { type: String, enum: ["pending", "processed", "failed"] },
        processedAt: Date,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    failureReason: String,
    webhookEvents: [
      {
        event: String,
        data: mongoose.Schema.Types.Mixed,
        receivedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Indexes
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ gateway: 1, status: 1 });
paymentSchema.index({ gatewayPaymentId: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
