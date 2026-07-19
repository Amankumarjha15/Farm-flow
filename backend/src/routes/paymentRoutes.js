const express = require('express');
const {
  initiateStripePayment,
  stripeWebhook,
  initiateRazorpayPayment,
  verifyRazorpayPayment,
  getPaymentHistory,
  mockCompletePayment,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// NOTE: the raw-body Stripe webhook route is mounted separately in app.js
// (before express.json()), since Stripe requires the unparsed body for signature verification.

router.post('/stripe/initiate', protect, authorize('retailer'), initiateStripePayment);
router.post('/razorpay/initiate', protect, authorize('retailer'), initiateRazorpayPayment);
router.post('/razorpay/verify', protect, authorize('retailer'), verifyRazorpayPayment);
router.post('/mock/complete', protect, authorize('retailer'), mockCompletePayment);
router.get('/history', protect, authorize('retailer'), getPaymentHistory);

module.exports = { router, stripeWebhook };
