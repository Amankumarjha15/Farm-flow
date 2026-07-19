const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder',
});

const createRazorpayOrder = async (amount, receipt) =>
  razorpay.orders.create({
    amount: Math.round(amount * 100), // paise
    currency: 'INR',
    receipt,
  });

const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
};

const refundRazorpayPayment = async (paymentId, amount) =>
  razorpay.payments.refund(paymentId, amount ? { amount: Math.round(amount * 100) } : {});

module.exports = { razorpay, createRazorpayOrder, verifyRazorpaySignature, refundRazorpayPayment };
