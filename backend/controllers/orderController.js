const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { buildPagination, paginationMeta } = require("../utils/helpers");
const emailService = require("../services/emailService");
const paymentService = require("../services/paymentService");

// ─── CREATE ORDER (CHECKOUT) ───────────────────────────────
exports.createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, notes, isGift, giftMessage } =
    req.body;

  // Get user's cart
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product",
  );
  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest("Cart is empty");
  }

  // Validate stock for all items
  const orderItems = [];
  for (const item of cart.items) {
    const product = item.product;
    if (!product || !product.isActive) {
      throw ApiError.badRequest(
        `Product "${item.product?.productName || "Unknown"}" is no longer available`,
      );
    }
    if (product.stock < item.quantity) {
      throw ApiError.badRequest(
        `"${product.productName}" only has ${product.stock} in stock`,
      );
    }
    orderItems.push({
      product: product._id,
      productName: product.productName,
      image: product.images[0]?.url || "",
      quantity: item.quantity,
      color: item.color,
      size: item.size,
      price: item.price,
      totalPrice: item.totalPrice,
    });
  }

  // Calculate totals
  const itemsTotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const shippingCost = itemsTotal >= 999 ? 0 : 79; // Free shipping over ₹999
  const tax = Math.round(itemsTotal * 0.18 * 100) / 100; // 18% GST
  const discount = cart.discount || 0;
  const totalAmount = itemsTotal + shippingCost + tax - discount;

  // Create order
  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentInfo: {
      method: paymentMethod,
      status: paymentMethod === "cod" ? "pending" : "pending",
    },
    itemsTotal,
    shippingCost,
    tax,
    discount,
    couponCode: cart.couponCode,
    totalAmount,
    status: paymentMethod === "cod" ? "confirmed" : "pending",
    notes,
    isGift,
    giftMessage,
  });

  // Handle payment gateway initialization
  let paymentData = null;

  if (paymentMethod === "razorpay") {
    const razorpayOrder = await paymentService.createRazorpayOrder({
      amount: totalAmount,
      receipt: order.orderNumber,
      notes: { orderId: order._id.toString() },
    });
    order.paymentInfo.gatewayOrderId = razorpayOrder.id;
    await order.save();

    // Create payment log
    await paymentService.createPaymentLog({
      order: order._id,
      user: req.user._id,
      gateway: "razorpay",
      gatewayOrderId: razorpayOrder.id,
      amount: totalAmount,
    });

    paymentData = {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    };
  }
  // Stripe checkout disabled — using Razorpay only
  // else if (paymentMethod === 'stripe') {
  //   const session = await paymentService.createStripeSession({
  //     items: orderItems,
  //     customer: req.user,
  //     metadata: { orderId: order._id.toString() },
  //     successUrl: `${process.env.FRONTEND_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
  //     cancelUrl: `${process.env.FRONTEND_URL}/cart`,
  //   });
  //   order.paymentInfo.gatewayOrderId = session.id;
  //   await order.save();
  //   await paymentService.createPaymentLog({
  //     order: order._id, user: req.user._id, gateway: 'stripe',
  //     gatewayOrderId: session.id, amount: totalAmount,
  //   });
  //   paymentData = { sessionId: session.id, url: session.url };
  // }

  // Reduce stock for COD orders immediately
  if (paymentMethod === "cod") {
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, sold: item.quantity },
      });
    }

    // Update coupon usage
    if (cart.couponCode) {
      await Coupon.findOneAndUpdate(
        { code: cart.couponCode },
        { $inc: { usedCount: 1 }, $push: { usedBy: { user: req.user._id } } },
      );
    }
  }

  // Clear cart
  cart.items = [];
  cart.couponCode = undefined;
  cart.discount = 0;
  await cart.save();

  // Send order confirmation email (non-blocking)
  emailService.sendOrderConfirmationEmail(req.user, order).catch(() => {});

  return ApiResponse.created(
    res,
    { order, payment: paymentData },
    "Order created",
  );
});

// ─── GET USER'S ORDERS ─────────────────────────────────────
exports.getMyOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query);

  const filter = { user: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, orders, paginationMeta(total, page, limit));
});

// ─── GET SINGLE ORDER ──────────────────────────────────────
exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).populate("items.product", "productName slug images");

  if (!order) throw ApiError.notFound("Order not found");

  return ApiResponse.success(res, { order });
});

// ─── CANCEL ORDER ──────────────────────────────────────────
exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!order) throw ApiError.notFound("Order not found");

  // Only allow cancellation for pending/confirmed orders
  if (!["pending", "confirmed"].includes(order.status)) {
    throw ApiError.badRequest("Order cannot be cancelled at this stage");
  }

  order.status = "cancelled";
  order.cancelledAt = new Date();
  order.cancelReason = req.body.reason || "Cancelled by customer";
  order.statusHistory.push({
    status: "cancelled",
    note: order.cancelReason,
    updatedBy: req.user._id,
  });
  await order.save();

  // Restore stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity, sold: -item.quantity },
    });
  }

  // Process refund if payment was made
  if (order.paymentInfo.status === "paid") {
    // Refund logic handled in payment controller
  }

  return ApiResponse.success(res, { order }, "Order cancelled");
});

// ─── TRACK ORDER ───────────────────────────────────────────
exports.trackOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).select(
    "orderNumber status statusHistory trackingNumber trackingUrl estimatedDelivery deliveredAt",
  );

  if (!order) throw ApiError.notFound("Order not found");

  return ApiResponse.success(res, { order });
});
