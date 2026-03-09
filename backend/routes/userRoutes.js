const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const { uploadAvatar } = require("../middleware/upload");
const validate = require("../middleware/validate");
const {
  updateProfileValidator,
  addAddressValidator,
} = require("../validators/userValidator");

// All routes require authentication
router.use(protect);

// Profile
router.get("/profile", userController.getProfile);
router.put(
  "/profile",
  updateProfileValidator,
  validate,
  userController.updateProfile,
);
router.put("/avatar", uploadAvatar, userController.updateAvatar);

// Addresses
router.get("/addresses", userController.getAddresses);
router.post(
  "/addresses",
  addAddressValidator,
  validate,
  userController.addAddress,
);
router.put("/addresses/:addressId", userController.updateAddress);
router.delete("/addresses/:addressId", userController.deleteAddress);

// Wishlist
router.get("/wishlist", userController.getWishlist);
router.post("/wishlist/:productId", userController.addToWishlist);
router.delete("/wishlist/:productId", userController.removeFromWishlist);

module.exports = router;
