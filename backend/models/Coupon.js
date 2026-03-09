const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: String,
    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    maxDiscount: {
      type: Number,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: null,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    perUserLimit: {
      type: Number,
      default: 1,
    },
    usedBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        usedAt: { type: Date, default: Date.now },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    applicableCategories: [String],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

couponSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

// Method: check if coupon is valid
couponSchema.methods.isValid = function (orderAmount, userId) {
  const now = new Date();
  if (!this.isActive) return { valid: false, message: "Coupon is inactive" };

  // Normalize dates: start of startDate and end of endDate (UTC)
  // This handles timezone edge cases (e.g., IST users vs UTC-stored dates)
  if (this.startDate) {
    const start = new Date(this.startDate);
    start.setUTCHours(0, 0, 0, 0);
    if (now < start) return { valid: false, message: "Coupon not yet active" };
  }
  if (this.endDate) {
    const end = new Date(this.endDate);
    end.setUTCHours(23, 59, 59, 999);
    if (now > end) return { valid: false, message: "Coupon has expired" };
  }
  if (this.usageLimit && this.usedCount >= this.usageLimit)
    return { valid: false, message: "Coupon usage limit reached" };
  if (orderAmount < this.minOrderAmount)
    return {
      valid: false,
      message: `Minimum order amount is ₹${this.minOrderAmount}`,
    };
  if (userId) {
    const userUsage = this.usedBy.filter(
      (u) => u.user.toString() === userId.toString(),
    ).length;
    if (userUsage >= this.perUserLimit)
      return {
        valid: false,
        message: "Coupon usage limit reached for this user",
      };
  }
  return { valid: true };
};

// Method: calculate discount
couponSchema.methods.calculateDiscount = function (orderAmount) {
  let discount = 0;
  if (this.discountType === "percentage") {
    discount = (orderAmount * this.discountValue) / 100;
    if (this.maxDiscount) discount = Math.min(discount, this.maxDiscount);
  } else {
    discount = this.discountValue;
  }
  return Math.min(discount, orderAmount);
};

module.exports = mongoose.model("Coupon", couponSchema);
