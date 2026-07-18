const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/ApiError');
const Order = require('../models/Order');
const Payout = require('../models/Payout');
const { notify } = require('../services/notificationService');

// @desc    List orders currently available for pickup (unassigned, ready for shipment)
// @route   GET /api/v1/logistics/available
// @access  Private (logistics, verified)
const getAvailableDeliveries = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    status: 'ready_for_shipment',
    logisticsPartner: null,
    isDeleted: false,
  })
    .populate('retailer', 'name')
    .sort('-createdAt');

  res.json({ success: true, data: orders });
});

// @desc    Accept a delivery. First logistics partner to hit this endpoint wins the assignment;
//          every subsequent accept attempt on the same order is atomically rejected.
// @route   PATCH /api/v1/logistics/:orderId/accept
// @access  Private (logistics, verified)
const acceptDelivery = asyncHandler(async (req, res) => {
  const { expectedDeliveryDate, expectedDeliveryTime, pickupMessage } = req.body;

  if (!req.user.isVerified) {
    throw new ApiError(403, 'Your logistics account must be verified before accepting deliveries');
  }

  // The atomicity here is the whole point: findOneAndUpdate performs the read-check-write as a
  // single indivisible operation at the database level. The filter requires logisticsPartner to
  // still be null at the moment of the write. If two partners race for the same order, MongoDB
  // guarantees only one of these concurrent update operations actually matches and modifies the
  // document — the other gets `null` back with no document matched. No manual locking needed.
  const order = await Order.findOneAndUpdate(
    { _id: req.params.orderId, status: 'ready_for_shipment', logisticsPartner: null, isDeleted: false },
    {
      $set: {
        logisticsPartner: req.user._id,
        logisticsAssignedAt: new Date(),
        expectedDeliveryDate,
        expectedDeliveryTime,
        pickupMessage,
        status: 'accepted_by_logistics',
      },
      $push: {
        timeline: {
          status: 'accepted_by_logistics',
          updatedBy: req.user._id,
          note: pickupMessage || 'Accepted by logistics partner',
        },
      },
    },
    { new: true }
  );

  if (!order) {
    throw new ApiError(409, 'This delivery has already been accepted by another logistics partner');
  }

  await notify(req, {
    userId: order.retailer,
    type: 'logistics_assigned',
    title: 'Logistics partner assigned',
    message: `${req.user.name} will handle delivery for order ${order.orderNumber}. Expected: ${expectedDeliveryDate} (${expectedDeliveryTime})`,
    link: `/retailer/orders/${order._id}`,
    relatedOrder: order._id,
  });

  const farmerIds = [...new Set(order.items.map((i) => String(i.farmer)))];
  await Promise.all(
    farmerIds.map((farmerId) =>
      notify(req, {
        userId: farmerId,
        type: 'logistics_assigned',
        title: 'Logistics partner assigned',
        message: `Order ${order.orderNumber} has been picked up by a logistics partner.`,
        link: `/farmer/orders/${order._id}`,
        relatedOrder: order._id,
      })
    )
  );

  res.json({ success: true, message: 'Delivery accepted and assigned to you', data: order });
});

// @desc    Update shipment status (assigned partner only)
// @route   PATCH /api/v1/logistics/:orderId/status
// @access  Private (logistics, assigned partner)
const updateDeliveryStatus = asyncHandler(async (req, res) => {
  const { status, currentLocation, eta, message } = req.body;

  const order = await Order.findOne({ _id: req.params.orderId, isDeleted: false });
  if (!order) throw new ApiError(404, 'Order not found');
  if (!order.logisticsPartner || String(order.logisticsPartner) !== String(req.user._id)) {
    throw new ApiError(403, 'You are not the assigned logistics partner for this order');
  }

  const validTransitions = {
    accepted_by_logistics: ['ready_to_ship'],
    ready_to_ship: ['shipped'],
    shipped: ['on_the_way'],
    on_the_way: ['delivered'],
  };
  if (!validTransitions[order.status]?.includes(status)) {
    throw new ApiError(400, `Cannot move from '${order.status}' to '${status}'`);
  }

  order.status = status;
  order.timeline.push({
    status,
    updatedBy: req.user._id,
    note: message,
    ...(status === 'on_the_way' && { currentLocation, eta }),
  });
  await order.save();

  if (status === 'delivered') {
    // Mark all payouts tied to this order as eligible for payout now that delivery is confirmed
    await Payout.updateMany(
      { order: order._id, status: 'pending' },
      { status: 'eligible', eligibleAt: new Date() }
    );

    const farmerIds = [...new Set(order.items.map((i) => String(i.farmer)))];
    await Promise.all(
      farmerIds.map((farmerId) =>
        notify(req, {
          userId: farmerId,
          type: 'status_updated',
          title: 'Order delivered',
          message: `Order ${order.orderNumber} was delivered. Your payout is now eligible for processing.`,
          relatedOrder: order._id,
        })
      )
    );
  }

  await notify(req, {
    userId: order.retailer,
    type: 'status_updated',
    title: `Order status: ${status.replace(/_/g, ' ')}`,
    message: message || `Your order ${order.orderNumber} is now "${status.replace(/_/g, ' ')}"${currentLocation ? ` — near ${currentLocation}, ETA ${eta}` : ''}.`,
    link: `/retailer/orders/${order._id}`,
    relatedOrder: order._id,
  });

  res.json({ success: true, message: 'Status updated', data: order });
});

// @desc    Push a fresh location/ETA update while an order is "On The Way" — unlike the status
//          transition endpoint (which only fires once, moving shipped → on_the_way), this can be
//          called as many times as the logistics partner needs while en route, appending a new
//          timeline entry each time without changing the order's status.
// @route   PATCH /api/v1/logistics/:orderId/location
// @access  Private (logistics, assigned partner)
const addLocationUpdate = asyncHandler(async (req, res) => {
  const { currentLocation, eta, message } = req.body;

  const order = await Order.findOne({ _id: req.params.orderId, isDeleted: false });
  if (!order) throw new ApiError(404, 'Order not found');
  if (!order.logisticsPartner || String(order.logisticsPartner) !== String(req.user._id)) {
    throw new ApiError(403, 'You are not the assigned logistics partner for this order');
  }
  if (order.status !== 'on_the_way') {
    throw new ApiError(400, `Location updates are only available while the order is 'on_the_way' (currently '${order.status}')`);
  }

  order.timeline.push({
    status: 'on_the_way',
    updatedBy: req.user._id,
    note: message,
    currentLocation,
    eta,
  });
  await order.save();

  await notify(req, {
    userId: order.retailer,
    type: 'status_updated',
    title: 'Delivery location update',
    message: message || `Your order ${order.orderNumber} is now near ${currentLocation}, ETA ${eta}.`,
    link: `/retailer/orders/${order._id}`,
    relatedOrder: order._id,
  });

  res.json({ success: true, message: 'Location update sent', data: order });
});

// @desc    Logistics partner's assigned (in-progress) deliveries
// @route   GET /api/v1/logistics/assigned
// @access  Private (logistics)
const getAssignedDeliveries = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    logisticsPartner: req.user._id,
    status: { $nin: ['delivered', 'cancelled'] },
    isDeleted: false,
  }).sort('-logisticsAssignedAt');

  res.json({ success: true, data: orders });
});

// @desc    Logistics partner's completed delivery history
// @route   GET /api/v1/logistics/history
// @access  Private (logistics)
const getDeliveryHistory = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const filter = { logisticsPartner: req.user._id, status: 'delivered', isDeleted: false };
  const [items, total] = await Promise.all([
    Order.find(filter).sort('-updatedAt').skip((page - 1) * limit).limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

module.exports = {
  getAvailableDeliveries,
  acceptDelivery,
  updateDeliveryStatus,
  addLocationUpdate,
  getAssignedDeliveries,
  getDeliveryHistory,
};
