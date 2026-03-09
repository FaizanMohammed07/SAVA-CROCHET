const { body } = require("express-validator");

const createProductValidator = [
  body("productName")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ max: 200 })
    .withMessage("Product name cannot exceed 200 characters"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ max: 5000 })
    .withMessage("Description cannot exceed 5000 characters"),
  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isIn([
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
    ])
    .withMessage("Invalid category"),
  body("crochetType")
    .notEmpty()
    .withMessage("Crochet type is required")
    .isIn([
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
    ])
    .withMessage("Invalid crochet type"),
  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("discountPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount price must be a positive number"),
  body("stock")
    .notEmpty()
    .withMessage("Stock is required")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  body("handmadeTime")
    .trim()
    .notEmpty()
    .withMessage("Handmade time is required"),
  body("material")
    .isArray({ min: 1 })
    .withMessage("At least one material is required"),
  body("colors")
    .isArray({ min: 1 })
    .withMessage("At least one color is required"),
  body("size")
    .optional()
    .isIn(["xs", "small", "medium", "large", "xl", "xxl", "custom", "one-size"])
    .withMessage("Invalid size"),
  body("difficulty")
    .optional()
    .isIn(["beginner", "intermediate", "advanced", "expert"])
    .withMessage("Invalid difficulty"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
];

const updateProductValidator = [
  body("productName")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Product name cannot exceed 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Description cannot exceed 5000 characters"),
  body("category")
    .optional()
    .isIn([
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
    ])
    .withMessage("Invalid category"),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
];

module.exports = { createProductValidator, updateProductValidator };
