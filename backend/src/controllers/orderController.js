const crypto = require('crypto');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/ApiError');
const Order = require('../models/Order');
const Produce = require('../models/Produce');
const Bid = require('../models/Bid');
const { notify } = require('../services/notificationService');

const generateOrderNumber = () => `FF-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

// @desc    Place an order (cart checkout). Atomically reserves stock per line item.
// @route   POST /api/v1/orders
// @access  Private (retailer)
const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, bidId } = req.body;

  const orderItems = [];
  const reserved = []; // for rollback if a later item fails

  try {
    for (const item of items) {
      // Atomic decrement: only succeeds if enough stock is currently available,
      // preventing overselling under concurrent checkouts.
      const produce = await Produce.findOneAndUpdate(
        { _id: item.produceId, isDeleted: false, availableQuantity: { $gte: item.quantity } },
        { $inc: { availableQuantity: -item.quantity } },
        { new: true }
      );

      if (!produce) {
        throw new ApiError(400, `Insufficient stock for the requested item (id: ${item.produceId})`);
      }

      reserved.push({ produceId: produce._id, quantity: item.quantity });

      // If this order fulfills an accepted bid, honor the negotiated price; else listing price.
      let unitPrice = produce.price;
      if (bidId) {
        const bid = await Bid.findOne({ _id: bidId, produce: produce._id, status: 'accepted' });
        if (bid) unitPrice = bid.counterPrice || bid.proposedPrice;
      }

      orderItems.push({
        produce: produce._id,
        farmer: produce.farmer,
        cropName: produce.cropName,
        quantity: item.quantity,
        unitPrice,
        subtotal: unitPrice * item.quantity,
      });
    }
  } catch (err) {
    // Roll back any stock already reserved before the failure
    await Promise.all(
      reserved.map((r) => Produce.updateOne({ _id: r.produceId }, { $inc: { availableQuantity: r.quantity } }))
    );
    throw err;
  }

  const totalAmount = orderItems.reduce((sum, i) => sum + i.subtotal, 0);

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    retailer: req.user._id,
    items: orderItems,
    totalAmount,
    shippingAddress,
    status: 'placed',
    timeline: [{ status: 'placed', updatedBy: req.user._id, note: 'Order placed by retailer' }],
  });

  // Notify each involved farmer
  const uniqueFarmers = [...new Set(orderItems.map((i) => String(i.farmer)))];
  await Promise.all(
    uniqueFarmers.map((farmerId) =>
      notify(req, {
        userId: farmerId,
        type: 'new_order',
        title: 'New order received',
        message: `Order ${order.orderNumber} placed for your produce. Awaiting payment.`,
        link: `/farmer/orders/${order._id}`,
        relatedOrder: order._id,
      })
    )
  );

  res.status(201).json({ success: true, message: 'Order placed. Proceed to payment.', data: order });
});

// @desc    Get single order (retailer owner, involved farmer, assigned logistics, or admin)
// @route   GET /api/v1/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, isDeleted: false })
    .populate('retailer', 'name email phone')
    .populate('logisticsPartner', 'name phone vehicleDetails')
    .populate('items.produce', 'cropName images');

  if (!order) throw new ApiError(404, 'Order not found');

  const isRetailer = String(order.retailer._id) === String(req.user._id);
  const isFarmer = order.items.some((i) => String(i.farmer) === String(req.user._id));
  const isLogistics = order.logisticsPartner && String(order.logisticsPartner._id) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';

  if (!isRetailer && !isFarmer && !isLogistics && !isAdmin) {
    throw new ApiError(403, 'Not authorized to view this order');
  }

  res.json({ success: true, data: order });
});

// @desc    Retailer's own order history
// @route   GET /api/v1/orders/my-orders
// @access  Private (retailer)
const getMyOrders = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const filter = { retailer: req.user._id, isDeleted: false };
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Order.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// @desc    Farmer's incoming orders (orders containing their produce)
// @route   GET /api/v1/orders/farmer-orders
// @access  Private (farmer)
const getFarmerOrders = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const filter = { 'items.farmer': req.user._id, isDeleted: false };
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Order.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// @desc    Cancel an order (only before payment/shipment)
// @route   PATCH /api/v1/orders/:id/cancel
// @access  Private (retailer, owner)
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, isDeleted: false });
  if (!order) throw new ApiError(404, 'Order not found');
  if (String(order.retailer) !== String(req.user._id)) throw new ApiError(403, 'Not authorized');
  if (!['placed', 'payment_pending'].includes(order.status)) {
    throw new ApiError(400, `Order cannot be cancelled once ${order.status}`);
  }

  // Restock items
  await Promise.all(
    order.items.map((item) =>
      Produce.updateOne({ _id: item.produce }, { $inc: { availableQuantity: item.quantity } })
    )
  );

  order.status = 'cancelled';
  order.timeline.push({ status: 'cancelled', updatedBy: req.user._id, note: 'Cancelled by retailer' });
  await order.save();

  res.json({ success: true, message: 'Order cancelled and stock restored', data: order });
});

module.exports = { createOrder, getOrderById, getMyOrders, getFarmerOrders, cancelOrder, generateOrderNumber };
