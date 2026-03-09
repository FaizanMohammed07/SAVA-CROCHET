const mongoose = require("mongoose");

const visitorSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    ip: String,
    userAgent: String,
    device: {
      type: { type: String },
      vendor: String,
      model: String,
    },
    browser: {
      name: String,
      version: String,
    },
    os: {
      name: String,
      version: String,
    },
    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "bot", "unknown"],
      default: "unknown",
      index: true,
    },
    referrer: String,
    landingPage: String,
    pagesVisited: [
      {
        path: String,
        title: String,
        visitedAt: { type: Date, default: Date.now },
        duration: Number, // seconds
      },
    ],
    productsViewed: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        viewedAt: { type: Date, default: Date.now },
        duration: Number,
      },
    ],
    sessionStart: { type: Date, default: Date.now },
    sessionEnd: Date,
    sessionDuration: Number, // seconds
    isReturning: { type: Boolean, default: false },
    country: String,
    city: String,
    conversionEvent: {
      type: String,
      enum: ["none", "signup", "add_to_cart", "purchase"],
      default: "none",
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
visitorSchema.index({ createdAt: -1 });
visitorSchema.index({ sessionStart: -1 });
visitorSchema.index({ conversionEvent: 1 });

module.exports = mongoose.model("Visitor", visitorSchema);
