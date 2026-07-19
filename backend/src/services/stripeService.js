const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

const createStripePaymentIntent = async (amount, currency = 'inr', metadata = {}) =>
  stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Stripe uses smallest currency unit
    currency,
    metadata,
    automatic_payment_methods: { enabled: true },
  });

const verifyStripeWebhookEvent = (rawBody, signature) =>
  stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);

const refundStripePayment = async (paymentIntentId, amount) =>
  stripe.refunds.create({
    payment_intent: paymentIntentId,
    ...(amount && { amount: Math.round(amount * 100) }),
  });

module.exports = { stripe, createStripePaymentIntent, verifyStripeWebhookEvent, refundStripePayment };
