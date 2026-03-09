const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    title: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },
    images: [
      {
        public_id: String,
        url: String,
      },
    ],
    isVerifiedPurchase: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },
    helpfulCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

// Ensure one review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ createdAt: -1 });

// Static: calculate average rating for a product
reviewSchema.statics.calcAverageRating = async function (productId) {
  const result = await this.aggregate([
    { $match: { product: productId, isApproved: true } },
    {
      $group: {
        _id: "$product",
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const Product = mongoose.model("Product");
  if (result.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      "rating.average": Math.round(result[0].avgRating * 10) / 10,
      "rating.count": result[0].count,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      "rating.average": 0,
      "rating.count": 0,
    });
  }
};

// Post-save: update product rating
reviewSchema.post("save", function () {
  this.constructor.calcAverageRating(this.product);
});

// Post-remove: update product rating
reviewSchema.post("findOneAndDelete", function (doc) {
  if (doc) doc.constructor.calcAverageRating(doc.product);
});

module.exports = mongoose.model("Review", reviewSchema);
