const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinary } = require("../config/cloudinary");
const ApiError = require("../utils/ApiError");
const { UPLOAD } = require("../utils/constants");

// Cloudinary storage for product images
const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "sava-crochets/products",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    transformation: [
      { width: 1200, height: 1200, crop: "limit", quality: "auto" },
    ],
  },
});

// Cloudinary storage for user avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "sava-crochets/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      {
        width: 300,
        height: 300,
        crop: "fill",
        gravity: "face",
        quality: "auto",
      },
    ],
  },
});

// Cloudinary storage for reservation reference images
const reservationStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "sava-crochets/reservations",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    transformation: [
      { width: 800, height: 800, crop: "limit", quality: "auto" },
    ],
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (UPLOAD.ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(400, "Only image files (JPEG, PNG, WebP, GIF) are allowed"),
      false,
    );
  }
};

// Upload middlewares
const uploadProductImages = multer({
  storage: productStorage,
  fileFilter,
  limits: { fileSize: UPLOAD.MAX_FILE_SIZE, files: UPLOAD.MAX_FILES },
}).array("images", UPLOAD.MAX_FILES);

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter,
  limits: { fileSize: UPLOAD.MAX_FILE_SIZE, files: 1 },
}).single("avatar");

const uploadReservationImages = multer({
  storage: reservationStorage,
  fileFilter,
  limits: { fileSize: UPLOAD.MAX_FILE_SIZE, files: 3 },
}).array("referenceImages", 3);

module.exports = {
  uploadProductImages,
  uploadAvatar,
  uploadReservationImages,
};
