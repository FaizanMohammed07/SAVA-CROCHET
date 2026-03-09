const Visitor = require("../models/Visitor");
const Product = require("../models/Product");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

// ─── TRACK PRODUCT VIEW ────────────────────────────────────
exports.trackProductView = asyncHandler(async (req, res) => {
  const { productId, duration } = req.body;
  const sessionId = req.cookies?.visitorSession || req.sessionId;

  if (sessionId && productId) {
    await Visitor.findOneAndUpdate(
      { sessionId },
      {
        $push: {
          productsViewed: {
            product: productId,
            viewedAt: new Date(),
            duration: duration || 0,
          },
        },
      },
    );

    // Increment product view count
    await Product.findByIdAndUpdate(productId, { $inc: { views: 1 } });
  }

  return ApiResponse.success(res, null, "View tracked");
});

// ─── END SESSION ───────────────────────────────────────────
exports.endSession = asyncHandler(async (req, res) => {
  const sessionId = req.cookies?.visitorSession;

  if (sessionId) {
    const visitor = await Visitor.findOne({ sessionId });
    if (visitor) {
      visitor.sessionEnd = new Date();
      visitor.sessionDuration = Math.round(
        (visitor.sessionEnd - visitor.sessionStart) / 1000,
      );
      await visitor.save();
    }
  }

  return ApiResponse.success(res, null, "Session ended");
});

// ─── TRACK CONVERSION EVENT ───────────────────────────────
exports.trackConversion = asyncHandler(async (req, res) => {
  const { event } = req.body; // 'signup', 'add_to_cart', 'purchase'
  const sessionId = req.cookies?.visitorSession;

  if (sessionId && event) {
    await Visitor.findOneAndUpdate({ sessionId }, { conversionEvent: event });
  }

  return ApiResponse.success(res, null, "Conversion tracked");
});
