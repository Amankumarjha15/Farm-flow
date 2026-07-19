const Order = require('../models/Order');
const Payout = require('../models/Payout');
const User = require('../models/User');
const { notify, notifyMany } = require('./notificationService');

/**
 * Called once a payment is confirmed successful (via Razorpay signature verification
 * or a Stripe webhook). Idempotent: safe to call more than once for the same order.
 */
const completeOrderPayment = async (req, order) => {
  if (order.status !== 'placed' && order.status !== 'payment_pending') {
    return order; // already processed — avoid double-firing side effects
  }

  order.status = 'ready_for_shipment';
  order.timeline.push({ status: 'payment_completed' });
  order.timeline.push({ status: 'ready_for_shipment', note: 'Awaiting logistics partner assignment' });
  await order.save();

  // Create a pending payout per farmer represented in this order (paid out after delivery)
  const farmerTotals = {};
  order.items.forEach((item) => {
    const key = String(item.farmer);
    farmerTotals[key] = (farmerTotals[key] || 0) + item.subtotal;
  });

  await Promise.all(
    Object.entries(farmerTotals).map(([farmerId, amount]) =>
      Payout.create({ farmer: farmerId, order: order._id, amount, status: 'pending' })
    )
  );

  await notify(req, {
    userId: order.retailer,
    type: 'payment_success',
    title: 'Payment successful',
    message: `Payment for order ${order.orderNumber} was successful.`,
    link: `/retailer/orders/${order._id}`,
    relatedOrder: order._id,
  });

  // Notify every eligible (verified, active) logistics partner that a delivery is available
  const logisticsPartners = await User.find({
    role: 'logistics',
    isVerified: true,
    isActive: true,
    isDeleted: false,
  }).select('_id');

  await notifyMany(
    req,
    logisticsPartners.map((p) => p._id),
    {
      type: 'delivery_available',
      title: 'New delivery available',
      message: `Order ${order.orderNumber} is ready for pickup assignment. First to accept gets it.`,
      link: `/logistics/available/${order._id}`,
      relatedOrder: order._id,
    }
  );

  return order;
};

module.exports = { completeOrderPayment };
