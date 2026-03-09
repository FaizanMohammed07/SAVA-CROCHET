const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    reservationNumber: {
      type: String,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    designRequest: {
      type: String,
      required: [true, "Design request is required"],
      maxlength: [3000, "Design request cannot exceed 3000 characters"],
    },
    referenceImages: [
      {
        public_id: String,
        url: String,
      },
    ],
    colorPreference: {
      type: [String],
      required: [true, "Color preference is required"],
    },
    size: {
      type: String,
      required: [true, "Size is required"],
    },
    category: {
      type: String,
      enum: [
        "amigurumi",
        "clothing",
        "accessories",
        "home-decor",
        "bags",
        "toys",
        "baby-items",
        "jewelry",
        "gifts",
        "other",
      ],
    },
    deliveryDeadline: {
      type: Date,
      required: [true, "Delivery deadline is required"],
      validate: {
        validator: function (val) {
          return val > new Date();
        },
        message: "Delivery deadline must be in the future",
      },
    },
    notes: {
      type: String,
      maxlength: [2000, "Notes cannot exceed 2000 characters"],
    },
    status: {
      type: String,
      enum: [
        "pending",
        "under_review",
        "approved",
        "rejected",
        "in_production",
        "quality_check",
        "ready",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },
    adminNotes: String,
    rejectionReason: String,
    estimatedPrice: {
      type: Number,
      min: 0,
    },
    finalPrice: {
      type: Number,
      min: 0,
    },
    priceAccepted: {
      type: Boolean,
      default: false,
    },
    productionStartDate: Date,
    productionEndDate: Date,
    estimatedCompletionDays: Number,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    paymentInfo: {
      method: String,
      transactionId: String,
      status: {
        type: String,
        enum: ["pending", "advance_paid", "fully_paid", "refunded"],
        default: "pending",
      },
      advanceAmount: Number,
      advancePaidAt: Date,
      fullPaidAt: Date,
    },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Indexes
reservationSchema.index({ createdAt: -1 });
reservationSchema.index({ status: 1, priority: 1 });

// Pre-save: generate reservation number
reservationSchema.pre("save", function (next) {
  if (this.isNew && !this.reservationNumber) {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.reservationNumber = `RES-${dateStr}-${random}`;

    this.statusHistory.push({
      status: this.status,
      note: "Reservation created",
    });
  }
  next();
});

module.exports = mongoose.model("Reservation", reservationSchema);
