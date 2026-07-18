const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/ApiError');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { createStripePaymentIntent, verifyStripeWebhookEvent, refundStripePayment } = require('../services/stripeService');
const { createRazorpayOrder, verifyRazorpaySignature, refundRazorpayPayment } = require('../services/razorpayService');
const { completeOrderPayment } = require('../services/paymentFulfillmentService');
const { notify } = require('../services/notificationService');

// @desc    Initiate a Stripe payment for an order
// @route   POST /api/v1/payments/stripe/initiate
// @access  Private (retailer)
const initiateStripePayment = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.body.orderId, retailer: req.user._id, isDeleted: false });
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.status !== 'placed') throw new ApiError(400, `Order is already ${order.status}`);

  const intent = await createStripePaymentIntent(order.totalAmount, 'inr', { orderId: String(order._id) });

  const payment = await Payment.create({
    order: order._id,
    retailer: req.user._id,
    provider: 'stripe',
    providerPaymentId: intent.id,
    amount: order.totalAmount,
    status: 'pending',
  });

  order.payment = payment._id;
  order.status = 'payment_pending';
  await order.save();

  res.json({ success: true, data: { clientSecret: intent.client_secret, paymentId: payment._id } });
});

// @desc    Stripe webhook — authoritative source of truth for payment success
// @route   POST /api/v1/payments/stripe/webhook
// @access  Public (verified via Stripe signature)
const stripeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = verifyStripeWebhookEvent(req.body, signature);
  } catch (err) {
    throw new ApiError(400, `Webhook signature verification failed: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const payment = await Payment.findOneAndUpdate(
      { providerPaymentId: intent.id },
      { status: 'success', rawResponse: intent },
      { new: true }
    );
    if (payment) {
      const order = await Order.findById(payment.order);
      if (order) await completeOrderPayment(req, order);
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object;
    const payment = await Payment.findOneAndUpdate(
      { providerPaymentId: intent.id },
      { status: 'failed', rawResponse: intent },
      { new: true }
    );
    if (payment) {
      await notify(req, {
        userId: payment.retailer,
        type: 'payment_failed',
        title: 'Payment failed',
        message: 'Your payment could not be processed. Please try again.',
        relatedOrder: payment.order,
      });
    }
  }

  res.json({ received: true });
});

// @desc    Initiate a Razorpay order for payment
// @route   POST /api/v1/payments/razorpay/initiate
// @access  Private (retailer)
const initiateRazorpayPayment = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.body.orderId, retailer: req.user._id, isDeleted: false });
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.status !== 'placed') throw new ApiError(400, `Order is already ${order.status}`);

  const rzpOrder = await createRazorpayOrder(order.totalAmount, order.orderNumber);

  const payment = await Payment.create({
    order: order._id,
    retailer: req.user._id,
    provider: 'razorpay',
    providerOrderId: rzpOrder.id,
    amount: order.totalAmount,
    status: 'pending',
  });

  order.payment = payment._id;
  order.status = 'payment_pending';
  await order.save();

  res.json({
    success: true,
    data: { razorpayOrderId: rzpOrder.id, amount: rzpOrder.amount, currency: rzpOrder.currency, paymentId: payment._id },
  });
});

// @desc    Verify Razorpay payment signature after client-side checkout completes
// @route   POST /api/v1/payments/razorpay/verify
// @access  Private (retailer)
const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  const isValid = verifyRazorpaySignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  const payment = await Payment.findOne({ providerOrderId: razorpayOrderId });
  if (!payment) throw new ApiError(404, 'Payment record not found');

  if (!isValid) {
    payment.status = 'failed';
    await payment.save();
    throw new ApiError(400, 'Payment signature verification failed');
  }

  payment.status = 'success';
  payment.providerPaymentId = razorpayPaymentId;
  await payment.save();

  const order = await Order.findById(payment.order);
  if (order) await completeOrderPayment(req, order);

  res.json({ success: true, message: 'Payment verified successfully', data: payment });
});

// @desc    Get payment/transaction history for logged-in retailer
// @route   GET /api/v1/payments/history
// @access  Private (retailer)
const getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ retailer: req.user._id }).populate('order', 'orderNumber totalAmount status').sort('-createdAt');
  res.json({ success: true, data: payments });
});

// @desc    DEV/TEST ONLY: simulate a successful payment without any real payment provider.
//          Runs the exact same fulfillment logic (order status, payout creation, logistics
//          notification) as a real Stripe/Razorpay success — the only thing skipped is the
//          actual charge. Intended for local development and demos; remove or gate behind an
//          admin-only flag before deploying to production.
// @route   POST /api/v1/payments/mock/complete
// @access  Private (retailer)
const mockCompletePayment = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_MOCK_PAYMENTS !== 'true') {
    throw new ApiError(403, 'Mock payments are disabled in production');
  }

  const order = await Order.findOne({ _id: req.body.orderId, retailer: req.user._id, isDeleted: false });
  if (!order) throw new ApiError(404, 'Order not found');
  if (!['placed', 'payment_pending'].includes(order.status)) {
    throw new ApiError(400, `Order is already ${order.status}`);
  }

  const payment = await Payment.create({
    order: order._id,
    retailer: req.user._id,
    provider: 'mock',
    providerPaymentId: `mock_${Date.now()}`,
    amount: order.totalAmount,
    status: 'success',
  });

  order.payment = payment._id;
  await order.save();

  const updatedOrder = await completeOrderPayment(req, order);

  res.json({
    success: true,
    message: 'Mock payment completed — order fulfillment logic ran exactly as it would for a real payment.',
    data: updatedOrder,
  });
});

module.exports = {
  initiateStripePayment,
  stripeWebhook,
  initiateRazorpayPayment,
  verifyRazorpayPayment,
  getPaymentHistory,
  mockCompletePayment,
};
