const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservationController");
const { protect } = require("../middleware/auth");
const { uploadReservationImages } = require("../middleware/upload");
const validate = require("../middleware/validate");
const {
  createReservationValidator,
  updateReservationStatusValidator,
} = require("../validators/reservationValidator");

// All reservation routes require authentication
router.use(protect);

router.post(
  "/",
  uploadReservationImages,
  createReservationValidator,
  validate,
  reservationController.createReservation,
);
router.get("/", reservationController.getMyReservations);
router.get("/:id", reservationController.getReservation);
router.post("/:id/cancel", reservationController.cancelReservation);
router.post("/:id/accept-price", reservationController.acceptPriceEstimate);

module.exports = router;
