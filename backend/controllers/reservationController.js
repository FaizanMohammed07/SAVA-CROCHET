const Reservation = require("../models/Reservation");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { buildPagination, paginationMeta } = require("../utils/helpers");

// ─── CREATE RESERVATION ────────────────────────────────────
exports.createReservation = asyncHandler(async (req, res) => {
  const {
    designRequest,
    colorPreference,
    size,
    category,
    deliveryDeadline,
    notes,
  } = req.body;

  // Handle uploaded reference images
  let referenceImages = [];
  if (req.files && req.files.length > 0) {
    referenceImages = req.files.map((file) => ({
      public_id: file.filename,
      url: file.path,
    }));
  }

  const reservation = await Reservation.create({
    user: req.user._id,
    designRequest,
    colorPreference,
    size,
    category,
    deliveryDeadline,
    notes,
    referenceImages,
  });

  return ApiResponse.created(
    res,
    { reservation },
    "Custom order request submitted",
  );
});

// ─── GET MY RESERVATIONS ───────────────────────────────────
exports.getMyReservations = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query);

  const filter = { user: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [reservations, total] = await Promise.all([
    Reservation.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Reservation.countDocuments(filter),
  ]);

  return ApiResponse.paginated(
    res,
    reservations,
    paginationMeta(total, page, limit),
  );
});

// ─── GET SINGLE RESERVATION ───────────────────────────────
exports.getReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!reservation) throw ApiError.notFound("Reservation not found");

  return ApiResponse.success(res, { reservation });
});

// ─── CANCEL RESERVATION ───────────────────────────────────
exports.cancelReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!reservation) throw ApiError.notFound("Reservation not found");

  if (!["pending", "under_review"].includes(reservation.status)) {
    throw ApiError.badRequest("Reservation cannot be cancelled at this stage");
  }

  reservation.status = "cancelled";
  reservation.statusHistory.push({
    status: "cancelled",
    note: req.body.reason || "Cancelled by customer",
    updatedBy: req.user._id,
  });
  await reservation.save();

  return ApiResponse.success(res, { reservation }, "Reservation cancelled");
});

// ─── ACCEPT PRICE ESTIMATE ────────────────────────────────
exports.acceptPriceEstimate = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findOne({
    _id: req.params.id,
    user: req.user._id,
    status: "approved",
  });

  if (!reservation) {
    throw ApiError.notFound("Reservation not found or not yet approved");
  }

  if (!reservation.estimatedPrice) {
    throw ApiError.badRequest("No price estimate available");
  }

  reservation.priceAccepted = true;
  reservation.finalPrice = reservation.estimatedPrice;
  reservation.statusHistory.push({
    status: "approved",
    note: "Price estimate accepted by customer",
    updatedBy: req.user._id,
  });
  await reservation.save();

  return ApiResponse.success(res, { reservation }, "Price estimate accepted");
});
