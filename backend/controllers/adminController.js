const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Reservation = require("../models/Reservation");
const Payment = require("../models/Payment");
const Coupon = require("../models/Coupon");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { buildPagination, paginationMeta } = require("../utils/helpers");
const emailService = require("../services/emailService");
const cacheService = require("../services/cacheService");

// ════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ════════════════════════════════════════════════════════════

exports.getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query);
  const filter = { role: "user" };

  if (req.query.search) {
    filter.$or = [
      { firstName: { $regex: req.query.search, $options: "i" } },
      { lastName: { $regex: req.query.search, $options: "i" } },
      { email: { $regex: req.query.search, $options: "i" } },
    ];
  }
  if (req.query.blocked === "true") filter.isBlocked = true;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, users, paginationMeta(total, page, limit));
});

exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password -refreshToken")
    .lean();
  if (!user) throw ApiError.notFound("User not found");

  // Get user's order stats
  const orderStats = await Order.aggregate([
    { $match: { user: user._id } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: "$totalAmount" },
      },
    },
  ]);

  return ApiResponse.success(res, {
    user,
    stats: orderStats[0] || { totalOrders: 0, totalSpent: 0 },
  });
});

exports.blockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");
  if (user.role === "admin" || user.role === "superadmin") {
    throw ApiError.forbidden("Cannot block admin users");
  }

  user.isBlocked = !user.isBlocked;
  user.refreshToken = ""; // Invalidate sessions
  await user.save({ validateBeforeSave: false });

  return ApiResponse.success(
    res,
    { isBlocked: user.isBlocked },
    `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`,
  );
});

// ════════════════════════════════════════════════════════════
// ORDER MANAGEMENT
// ════════════════════════════════════════════════════════════

exports.getAllOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query);
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.paymentStatus)
    filter["paymentInfo.status"] = req.query.paymentStatus;
  if (req.query.search) {
    filter.orderNumber = { $regex: req.query.search, $options: "i" };
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, orders, paginationMeta(total, page, limit));
});

exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "firstName lastName email phone")
    .populate("items.product", "productName slug images");

  if (!order) throw ApiError.notFound("Order not found");

  return ApiResponse.success(res, { order });
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note, trackingNumber, trackingUrl } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound("Order not found");

  // Validate status transition
  const validTransitions = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["out_for_delivery", "returned"],
    out_for_delivery: ["delivered", "returned"],
    delivered: ["returned"],
    cancelled: [],
    returned: ["refunded"],
    refunded: [],
  };

  if (!validTransitions[order.status]?.includes(status)) {
    throw ApiError.badRequest(
      `Cannot transition from '${order.status}' to '${status}'`,
    );
  }

  order.status = status;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (trackingUrl) order.trackingUrl = trackingUrl;
  if (status === "delivered") order.deliveredAt = new Date();
  if (status === "cancelled") order.cancelledAt = new Date();

  order.statusHistory.push({
    status,
    note: note || `Status updated to ${status}`,
    updatedBy: req.user._id,
  });

  await order.save();

  // Send status update email
  const user = await User.findById(order.user);
  if (user)
    emailService.sendOrderStatusUpdateEmail(user, order).catch(() => {});

  // Restore stock on cancellation
  if (status === "cancelled") {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, sold: -item.quantity },
      });
    }
  }

  return ApiResponse.success(res, { order }, "Order status updated");
});

// ════════════════════════════════════════════════════════════
// PRODUCT MANAGEMENT (Admin-specific)
// ════════════════════════════════════════════════════════════

exports.getInventory = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query);
  const filter = {};

  if (req.query.lowStock === "true") filter.stock = { $lte: 5 };
  if (req.query.outOfStock === "true") filter.stock = 0;
  if (req.query.category) filter.category = req.query.category;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .select("productName slug stock price sold category isActive images")
      .sort({ stock: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return ApiResponse.paginated(
    res,
    products,
    paginationMeta(total, page, limit),
  );
});

exports.updateStock = asyncHandler(async (req, res) => {
  const { stock } = req.body;
  if (stock === undefined || stock < 0) {
    throw ApiError.badRequest("Valid stock quantity is required");
  }

  const product = await Product.findByIdAndUpdate(
    req.params.productId || req.params.id,
    { stock },
    { new: true },
  );
  if (!product) throw ApiError.notFound("Product not found");

  await cacheService.invalidatePattern("products:*");

  return ApiResponse.success(res, { product }, "Stock updated");
});

// ════════════════════════════════════════════════════════════
// RESERVATION MANAGEMENT
// ════════════════════════════════════════════════════════════

exports.getAllReservations = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query);
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;

  const [reservations, total] = await Promise.all([
    Reservation.find(filter)
      .populate("user", "firstName lastName email phone")
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

exports.updateReservationStatus = asyncHandler(async (req, res) => {
  const {
    status,
    adminNotes,
    estimatedPrice,
    rejectionReason,
    estimatedCompletionDays,
    priority,
  } = req.body;

  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) throw ApiError.notFound("Reservation not found");

  reservation.status = status;
  if (adminNotes) reservation.adminNotes = adminNotes;
  if (estimatedPrice) reservation.estimatedPrice = estimatedPrice;
  if (rejectionReason) reservation.rejectionReason = rejectionReason;
  if (estimatedCompletionDays)
    reservation.estimatedCompletionDays = estimatedCompletionDays;
  if (priority) reservation.priority = priority;

  if (status === "in_production") reservation.productionStartDate = new Date();

  reservation.statusHistory.push({
    status,
    note: adminNotes || `Status updated to ${status}`,
    updatedBy: req.user._id,
  });

  await reservation.save();

  // Notify user
  const user = await User.findById(reservation.user);
  if (user) {
    const statusMessages = {
      under_review: "Your custom order is being reviewed by our artisans.",
      approved: `Your custom order has been approved! Estimated price: ₹${estimatedPrice || "TBD"}`,
      rejected: `We're sorry, your custom order request was declined. Reason: ${rejectionReason || "N/A"}`,
      in_production: "Your custom item is now being crafted! 🧶",
      quality_check: "Your item is undergoing quality check.",
      ready: "Your custom item is ready for shipping!",
      shipped: "Your custom order has been shipped!",
      delivered: "Your custom order has been delivered! Enjoy!",
    };

    if (statusMessages[status]) {
      emailService
        .sendReservationUpdateEmail(user, reservation, statusMessages[status])
        .catch(() => {});
    }
  }

  return ApiResponse.success(res, { reservation }, "Reservation updated");
});

// ════════════════════════════════════════════════════════════
// COUPON MANAGEMENT
// ════════════════════════════════════════════════════════════

exports.createCoupon = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user._id;
  const coupon = await Coupon.create(req.body);
  return ApiResponse.created(res, { coupon }, "Coupon created");
});

exports.getAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
  return ApiResponse.success(res, coupons);
});

exports.updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!coupon) throw ApiError.notFound("Coupon not found");
  return ApiResponse.success(res, { coupon }, "Coupon updated");
});

exports.deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw ApiError.notFound("Coupon not found");
  return ApiResponse.success(res, null, "Coupon deleted");
});

// ════════════════════════════════════════════════════════════
// PAYMENT LOGS
// ════════════════════════════════════════════════════════════

exports.getPaymentLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query);
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.gateway) filter.gateway = req.query.gateway;

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate("user", "firstName lastName email")
      .populate("order", "orderNumber totalAmount")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Payment.countDocuments(filter),
  ]);

  return ApiResponse.paginated(
    res,
    payments,
    paginationMeta(total, page, limit),
  );
});

exports.adminRefundPayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const { amount, reason } = req.body;

  const payment = await Payment.findById(paymentId);
  if (!payment) throw ApiError.notFound("Payment not found");

  if (payment.status !== "completed") {
    throw ApiError.badRequest("Only completed payments can be refunded");
  }

  // Find the associated order
  const order = await Order.findById(payment.order);
  if (!order) throw ApiError.notFound("Associated order not found");

  if (order.paymentInfo.status !== "paid") {
    throw ApiError.badRequest("Order payment is not in a refundable state");
  }

  const refundAmount = amount || order.totalAmount;

  // For now, mark as refunded (actual gateway refund would go here)
  order.paymentInfo.status =
    amount && amount < order.totalAmount ? "partially_refunded" : "refunded";
  order.paymentInfo.refundAmount = refundAmount;
  order.paymentInfo.refundedAt = new Date();
  order.status = "refunded";
  order.statusHistory.push({
    status: "refunded",
    note: `Refund of ₹${refundAmount} processed by admin. Reason: ${reason || "N/A"}`,
    updatedBy: req.user._id,
  });
  await order.save();

  // Update payment log
  payment.status =
    amount && amount < order.totalAmount ? "partially_refunded" : "refunded";
  await payment.save();

  return ApiResponse.success(
    res,
    { payment, order },
    "Refund processed successfully",
  );
});
