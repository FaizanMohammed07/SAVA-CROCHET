const Stripe = require("stripe");
const logger = require("../utils/logger");

let stripeInstance = null;

const initStripe = () => {
  try {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });
    logger.info("Stripe initialized");
    return stripeInstance;
  } catch (error) {
    logger.error(`Stripe init failed: ${error.message}`);
    return null;
  }
};

const getStripe = () => {
  if (!stripeInstance) initStripe();
  return stripeInstance;
};

module.exports = { initStripe, getStripe };
