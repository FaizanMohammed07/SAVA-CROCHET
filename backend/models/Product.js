const mongoose = require("mongoose");
const slugify = require("slugify");

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
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
        "seasonal",
        "other",
      ],
      index: true,
    },
    crochetType: {
      type: String,
      required: [true, "Crochet type is required"],
      enum: [
        "single-crochet",
        "double-crochet",
        "granny-square",
        "tunisian",
        "tapestry",
        "filet",
        "amigurumi",
        "freeform",
        "irish-crochet",
        "broomstick-lace",
        "other",
      ],
      index: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
      index: true,
    },
    discountPrice: {
      type: Number,
      min: [0, "Discount price cannot be negative"],
      validate: {
        validator: function (val) {
          return !val || val < this.price;
        },
        message: "Discount price must be less than original price",
      },
    },
    images: [
      {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
        alt: { type: String, default: "" },
      },
    ],
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    tags: {
      type: [String],
      index: true,
    },
    handmadeTime: {
      type: String,
      required: true,
      trim: true,
    },
    material: {
      type: [String],
      required: [true, "Material is required"],
      index: true,
    },
    colors: {
      type: [String],
      required: [true, "At least one color is required"],
      index: true,
    },
    size: {
      type: String,
      enum: [
        "xs",
        "small",
        "medium",
        "large",
        "xl",
        "xxl",
        "custom",
        "one-size",
      ],
      default: "one-size",
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "expert"],
      default: "intermediate",
      index: true,
    },
    weight: {
      type: Number,
      min: 0,
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: { type: String, enum: ["cm", "inch"], default: "cm" },
    },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sold: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Compound indexes for common queries
productSchema.index({ category: 1, price: 1 });
productSchema.index({ crochetType: 1, price: 1 });
productSchema.index({ isActive: 1, isFeatured: 1 });
productSchema.index({ "rating.average": -1 });
productSchema.index({ sold: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ productName: "text", description: "text", tags: "text" });

// Virtual: effective price
productSchema.virtual("effectivePrice").get(function () {
  return this.discountPrice || this.price;
});

// Virtual: discount percentage
productSchema.virtual("discountPercentage").get(function () {
  if (!this.discountPrice) return 0;
  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

// Virtual: in stock
productSchema.virtual("inStock").get(function () {
  return this.stock > 0;
});

// Pre-save: generate slug
productSchema.pre("save", function (next) {
  if (this.isModified("productName")) {
    this.slug =
      slugify(this.productName, {
        lower: true,
        strict: true,
      }) +
      "-" +
      this._id.toString().slice(-6);
  }
  next();
});

// Static: search products
productSchema.statics.searchProducts = function (query) {
  return this.find(
    { $text: { $search: query }, isActive: true },
    { score: { $meta: "textScore" } },
  ).sort({ score: { $meta: "textScore" } });
};

module.exports = mongoose.model("Product", productSchema);
