const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { protect, authorize, optionalAuth } = require("../middleware/auth");
const { uploadProductImages } = require("../middleware/upload");
const { cache } = require("../middleware/cache");
const validate = require("../middleware/validate");
const {
  createProductValidator,
  updateProductValidator,
} = require("../validators/productValidator");
const { CACHE_TTL } = require("../utils/constants");

/**
 * Normalize multipart form fields that should be arrays.
 * Multer text fields with duplicate names may not auto-array;
 * also handles comma-separated strings → arrays.
 */
const normalizeArrayFields = (req, _res, next) => {
  const arrayFields = ["material", "colors", "tags"];
  for (const field of arrayFields) {
    const value = req.body[field];
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) continue; // already an array
    // If it's a string, split by comma
    if (typeof value === "string") {
      req.body[field] = value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }
  }
  next();
};

// Public routes
router.get(
  "/",
  cache("products", CACHE_TTL.PRODUCTS),
  productController.getAllProducts,
);
router.get("/search", productController.searchProducts);
router.get("/suggestions", productController.searchSuggestions);
router.get(
  "/featured",
  cache("products:featured", CACHE_TTL.PRODUCTS),
  productController.getFeaturedProducts,
);
router.get(
  "/category/:category",
  cache("products:category", CACHE_TTL.PRODUCTS),
  productController.getProductsByCategory,
);
router.get("/:id", optionalAuth, productController.getProduct);
router.get("/:id/reviews", productController.getProductReviews);
router.get("/:id/recommendations", productController.getRecommendations);

// Protected routes
router.post("/:id/reviews", protect, productController.addReview);

// Admin routes
router.post(
  "/",
  protect,
  authorize("admin", "superadmin"),
  uploadProductImages,
  normalizeArrayFields,
  createProductValidator,
  validate,
  productController.createProduct,
);
router.put(
  "/:id",
  protect,
  authorize("admin", "superadmin"),
  uploadProductImages,
  normalizeArrayFields,
  updateProductValidator,
  validate,
  productController.updateProduct,
);
router.delete(
  "/:id",
  protect,
  authorize("admin", "superadmin"),
  productController.deleteProduct,
);
router.delete(
  "/:id/images/:imageId",
  protect,
  authorize("admin", "superadmin"),
  productController.deleteProductImage,
);

module.exports = router;
