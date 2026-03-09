const Razorpay = require("razorpay");
const logger = require("../utils/logger");

let razorpayInstance = null;

const initRazorpay = () => {
  try {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    logger.info("Razorpay initialized");
    return razorpayInstance;
  } catch (error) {
    logger.error(`Razorpay init failed: ${error.message}`);
    return null;
  }
};

const getRazorpay = () => {
  if (!razorpayInstance) initRazorpay();
  return razorpayInstance;
};

module.exports = { initRazorpay, getRazorpay };
