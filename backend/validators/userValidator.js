const { body, param } = require("express-validator");

const updateProfileValidator = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("First name cannot exceed 50 characters"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Last name cannot exceed 50 characters"),
  body("phone")
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Invalid Indian phone number"),
];

const addAddressValidator = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("phone").notEmpty().withMessage("Phone number is required"),
  body("addressLine1")
    .trim()
    .notEmpty()
    .withMessage("Address line 1 is required"),
  body("city").trim().notEmpty().withMessage("City is required"),
  body("state").trim().notEmpty().withMessage("State is required"),
  body("pincode")
    .trim()
    .notEmpty()
    .withMessage("Pincode is required")
    .matches(/^\d{6}$/)
    .withMessage("Invalid pincode"),
  body("label")
    .optional()
    .isIn(["home", "work", "other"])
    .withMessage("Invalid label"),
];

module.exports = { updateProfileValidator, addAddressValidator };
