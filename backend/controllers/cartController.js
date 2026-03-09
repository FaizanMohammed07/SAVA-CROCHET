const Cart = require("../models/Cart");
const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

// ─── GET CART ──────────────────────────────────────────────
exports.getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product",
    "productName slug images price discountPrice stock",
  );

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  return ApiResponse.success(res, { cart });
});

// ─── ADD TO CART ───────────────────────────────────────────
exports.addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, color, size } = req.body;

  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound("Product not found");
  if (!product.isActive) throw ApiError.badRequest("Product is not available");
  if (product.stock < quantity)
    throw ApiError.badRequest(`Only ${product.stock} items in stock`);

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  // Check if product already in cart
  const existingItem = cart.items.find(
    (item) =>
      item.product.toString() === productId &&
      item.color === color &&
      item.size === size,
  );

  const effectivePrice = product.discountPrice || product.price;

  if (existingItem) {
    const newQty = existingItem.quantity + quantity;
    if (newQty > 10)
      throw ApiError.badRequest("Cannot add more than 10 of the same item");
    if (newQty > product.stock) throw ApiError.badRequest("Not enough stock");

    existingItem.quantity = newQty;
    existingItem.price = effectivePrice;
    existingItem.totalPrice = effectivePrice * newQty;
  } else {
    cart.items.push({
      product: productId,
      quantity,
      color,
      size,
      price: effectivePrice,
      totalPrice: effectivePrice * quantity,
    });
  }

  await cart.save();

  // Populate for response
  await cart.populate(
    "items.product",
    "productName slug images price discountPrice stock",
  );

  return ApiResponse.success(res, { cart }, "Item added to cart");
});

// ─── UPDATE CART ITEM ──────────────────────────────────────
exports.updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const { itemId } = req.params;

  if (quantity < 1 || quantity > 10) {
    throw ApiError.badRequest("Quantity must be between 1 and 10");
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw ApiError.notFound("Cart not found");

  const item = cart.items.id(itemId);
  if (!item) throw ApiError.notFound("Cart item not found");

  // Check stock
  const product = await Product.findById(item.product);
  if (product.stock < quantity) {
    throw ApiError.badRequest(`Only ${product.stock} items in stock`);
  }

  item.quantity = quantity;
  item.totalPrice = item.price * quantity;
  await cart.save();

  await cart.populate(
    "items.product",
    "productName slug images price discountPrice stock",
  );

  return ApiResponse.success(res, { cart }, "Cart updated");
});

// ─── REMOVE CART ITEM ──────────────────────────────────────
exports.removeCartItem = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw ApiError.notFound("Cart not found");

  const item = cart.items.id(req.params.itemId);
  if (!item) throw ApiError.notFound("Cart item not found");

  item.deleteOne();
  await cart.save();

  await cart.populate(
    "items.product",
    "productName slug images price discountPrice stock",
  );

  return ApiResponse.success(res, { cart }, "Item removed from cart");
});

// ─── CLEAR CART ────────────────────────────────────────────
exports.clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    cart.couponCode = undefined;
    cart.discount = 0;
    await cart.save();
  }
  return ApiResponse.success(res, null, "Cart cleared");
});

// ─── APPLY COUPON ──────────────────────────────────────────
exports.applyCoupon = asyncHandler(async (req, res) => {
  const { couponCode } = req.body;
  const Coupon = require("../models/Coupon");

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest("Cart is empty");
  }

  const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
  if (!coupon) throw ApiError.notFound("Coupon not found");

  // Recalculate totals before validating (pre-save may not have run)
  const cartTotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);

  const validation = coupon.isValid(cartTotal, req.user._id);
  if (!validation.valid) throw ApiError.badRequest(validation.message);

  const discount = coupon.calculateDiscount(cartTotal);
  cart.couponCode = coupon.code;
  cart.discount = discount;
  await cart.save();

  return ApiResponse.success(
    res,
    {
      cart,
      discount,
      finalAmount: cartTotal - discount,
      couponCode: coupon.code,
    },
    "Coupon applied",
  );
});

// ─── REMOVE COUPON ─────────────────────────────────────────
exports.removeCoupon = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw ApiError.notFound("Cart not found");

  cart.couponCode = undefined;
  cart.discount = 0;
  await cart.save();

  return ApiResponse.success(res, { cart }, "Coupon removed");
});
