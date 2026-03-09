const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { sanitizeUser } = require("../utils/helpers");
const imageService = require("../services/imageService");

// ─── GET PROFILE ───────────────────────────────────────────
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    "wishlist",
    "productName slug images price discountPrice",
  );
  return ApiResponse.success(res, { user: sanitizeUser(user) });
});

// ─── UPDATE PROFILE ────────────────────────────────────────
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ["firstName", "lastName", "phone"];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  return ApiResponse.success(
    res,
    { user: sanitizeUser(user) },
    "Profile updated",
  );
});

// ─── UPDATE AVATAR ─────────────────────────────────────────
exports.updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest("Please upload an image");
  }

  const user = await User.findById(req.user._id);

  // Delete old avatar from Cloudinary
  if (user.avatar?.public_id) {
    await imageService.deleteImage(user.avatar.public_id);
  }

  user.avatar = {
    public_id: req.file.filename,
    url: req.file.path,
  };
  await user.save({ validateBeforeSave: false });

  return ApiResponse.success(
    res,
    { user: sanitizeUser(user) },
    "Avatar updated",
  );
});

// ─── ADD ADDRESS ───────────────────────────────────────────
exports.addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user.addresses.length >= 5) {
    throw ApiError.badRequest("Maximum 5 addresses allowed");
  }

  // If this is the first address or marked as default, update others
  if (req.body.isDefault || user.addresses.length === 0) {
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
    req.body.isDefault = true;
  }

  user.addresses.push(req.body);
  await user.save();

  return ApiResponse.created(
    res,
    { addresses: user.addresses },
    "Address added",
  );
});

// ─── UPDATE ADDRESS ────────────────────────────────────────
exports.updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);

  if (!address) {
    throw ApiError.notFound("Address not found");
  }

  Object.assign(address, req.body);

  if (req.body.isDefault) {
    user.addresses.forEach((addr) => {
      addr.isDefault = addr._id.toString() === req.params.addressId;
    });
  }

  await user.save();
  return ApiResponse.success(
    res,
    { addresses: user.addresses },
    "Address updated",
  );
});

// ─── DELETE ADDRESS ────────────────────────────────────────
exports.deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);

  if (!address) {
    throw ApiError.notFound("Address not found");
  }

  address.deleteOne();
  await user.save();

  return ApiResponse.success(
    res,
    { addresses: user.addresses },
    "Address deleted",
  );
});

// ─── GET ADDRESSES ─────────────────────────────────────────
exports.getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("addresses");
  return ApiResponse.success(res, { addresses: user.addresses });
});

// ─── ADD TO WISHLIST ───────────────────────────────────────
exports.addToWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const productId = req.params.productId;

  if (user.wishlist.includes(productId)) {
    throw ApiError.conflict("Product already in wishlist");
  }

  user.wishlist.push(productId);
  await user.save();

  return ApiResponse.success(res, null, "Added to wishlist");
});

// ─── REMOVE FROM WISHLIST ──────────────────────────────────
exports.removeFromWishlist = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $pull: { wishlist: req.params.productId },
  });
  return ApiResponse.success(res, null, "Removed from wishlist");
});

// ─── GET WISHLIST ──────────────────────────────────────────
exports.getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    "wishlist",
    "productName slug images price discountPrice rating stock",
  );
  return ApiResponse.success(res, { wishlist: user.wishlist });
});
