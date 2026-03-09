const express = require("express");
const router = express.Router();
const visitorController = require("../controllers/visitorController");
const { optionalAuth } = require("../middleware/auth");
const visitorTracker = require("../middleware/visitorTracker");

// Visitor tracking (works for both authenticated and anonymous users)
router.use(visitorTracker);

router.post("/product-view", optionalAuth, visitorController.trackProductView);
router.post("/end-session", optionalAuth, visitorController.endSession);
router.post("/conversion", optionalAuth, visitorController.trackConversion);

module.exports = router;
