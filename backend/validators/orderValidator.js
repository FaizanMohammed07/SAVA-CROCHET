const { body } = require("express-validator");

const createOrderValidator = [
  body("shippingAddress")
    .notEmpty()
    .withMessage("Shipping address is required"),
  body("shippingAddress.fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required"),
  body("shippingAddress.phone")
    .notEmpty()
    .withMessage("Phone number is required"),
  body("shippingAddress.addressLine1")
    .trim()
    .notEmpty()
    .withMessage("Address line 1 is required"),
  body("shippingAddress.city")
    .trim()
    .notEmpty()
    .withMessage("City is required"),
  body("shippingAddress.state")
    .trim()
    .notEmpty()
    .withMessage("State is required"),
  body("shippingAddress.pincode")
    .trim()
    .notEmpty()
    .withMessage("Pincode is required")
    .matches(/^\d{6}$/)
    .withMessage("Invalid pincode"),
  body("paymentMethod")
    .notEmpty()
    .withMessage("Payment method is required")
    .isIn(["razorpay", "stripe", "cod"])
    .withMessage("Invalid payment method"),
];

const updateOrderStatusValidator = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn([
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "out_for_delivery",
      "delivered",
      "cancelled",
      "returned",
      "refunded",
    ])
    .withMessage("Invalid order status"),
  body("note").optional().trim(),
  body("trackingNumber").optional().trim(),
  body("trackingUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("Invalid tracking URL"),
];

module.exports = { createOrderValidator, updateOrderStatusValidator };
