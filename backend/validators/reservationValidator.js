const { body } = require("express-validator");

const createReservationValidator = [
  body("designRequest")
    .trim()
    .notEmpty()
    .withMessage("Design request is required")
    .isLength({ max: 3000 })
    .withMessage("Design request cannot exceed 3000 characters"),
  body("colorPreference")
    .isArray({ min: 1 })
    .withMessage("At least one color preference is required"),
  body("size").trim().notEmpty().withMessage("Size is required"),
  body("deliveryDeadline")
    .notEmpty()
    .withMessage("Delivery deadline is required")
    .isISO8601()
    .withMessage("Invalid date format")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("Delivery deadline must be in the future");
      }
      return true;
    }),
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
      "other",
    ])
    .withMessage("Invalid category"),
  body("notes")
    .optional()
    .isLength({ max: 2000 })
    .withMessage("Notes cannot exceed 2000 characters"),
];

const updateReservationStatusValidator = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn([
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
    ])
    .withMessage("Invalid reservation status"),
  body("adminNotes").optional().trim(),
  body("estimatedPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Estimated price must be positive"),
  body("rejectionReason").optional().trim(),
];

module.exports = {
  createReservationValidator,
  updateReservationStatusValidator,
};
