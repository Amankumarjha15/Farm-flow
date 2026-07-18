const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/ApiError');
const Dispute = require('../models/Dispute');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { uploadImages } = require('../services/cloudinaryService');
const { refundStripePayment } = require('../services/stripeService');
const { refundRazorpayPayment } = require('../services/razorpayService');
const { notify } = require('../services/notificationService');

// @desc    Retailer raises a quality dispute on a delivered order
// @route   POST /api/v1/disputes
// @access  Private (retailer)
const createDispute = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.body.orderId, retailer: req.user._id, isDeleted: false });
  if (!order) throw new ApiError(404, 'Order not found');

  const images = req.files?.length ? await uploadImages(req.files, 'farmflow/disputes') : [];
  const primaryFarmer = order.items[0]?.farmer;

  const dispute = await Dispute.create({
    order: order._id,
    retailer: req.user._id,
    farmer: primaryFarmer,
    complaint: req.body.complaint,
    images,
  });

  order.status = 'disputed';
  order.timeline.push({ status: 'disputed', updatedBy: req.user._id, note: 'Retailer raised a quality dispute' });
  await order.save();

  await notify(req, {
    userId: primaryFarmer,
    type: 'dispute_raised',
    title: 'Dispute raised on your order',
    message: `A quality dispute was raised for order ${order.orderNumber}.`,
    relatedOrder: order._id,
  });

  res.status(201).json({ success: true, message: 'Dispute submitted for admin review', data: dispute });
});

// @desc    Admin: list all disputes
// @route   GET /api/v1/disputes/admin
// @access  Private (admin)
const getAllDisputes = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const disputes = await Dispute.find(filter)
    .populate('retailer', 'name email')
    .populate('farmer', 'name email')
    .populate('order', 'orderNumber totalAmount')
    .sort('-createdAt');

  res.json({ success: true, data: disputes });
});

// @desc    Admin resolves a dispute: refund / partial refund / reject / replacement
// @route   PATCH /api/v1/disputes/:id/resolve
// @access  Private (admin)
const resolveDispute = asyncHandler(async (req, res) => {
  const { action, resolutionNote, refundAmount } = req.body;

  const dispute = await Dispute.findById(req.params.id).populate('order');
  if (!dispute) throw new ApiError(404, 'Dispute not found');
  if (dispute.status !== 'open' && dispute.status !== 'under_review') {
    throw new ApiError(400, `Dispute already resolved as '${dispute.status}'`);
  }

  if (action === 'refund' || action === 'partial_refund') {
    const payment = await Payment.findOne({ order: dispute.order._id, status: 'success' });
    if (payment) {
      const amountToRefund = action === 'partial_refund' ? refundAmount : payment.amount;
      try {
        if (payment.provider === 'stripe') {
          await refundStripePayment(payment.providerPaymentId, action === 'partial_refund' ? amountToRefund : undefined);
        } else if (payment.provider === 'razorpay') {
          await refundRazorpayPayment(payment.providerPaymentId, action === 'partial_refund' ? amountToRefund : undefined);
        }
        payment.status = action === 'partial_refund' ? 'partially_refunded' : 'refunded';
        payment.refundAmount = amountToRefund;
        await payment.save();
      } catch (err) {
        throw new ApiError(502, `Refund processing failed: ${err.message}`);
      }
    }
  }

  dispute.status = action;
  dispute.resolutionNote = resolutionNote;
  dispute.refundAmount = action === 'partial_refund' ? refundAmount : undefined;
  dispute.resolvedBy = req.user._id;
  dispute.resolvedAt = new Date();
  await dispute.save();

  await notify(req, {
    userId: dispute.retailer,
    type: 'dispute_resolved',
    title: 'Dispute resolved',
    message: `Your dispute was resolved: ${action.replace(/_/g, ' ')}.${resolutionNote ? ` Note: ${resolutionNote}` : ''}`,
    relatedOrder: dispute.order._id,
  });

  res.json({ success: true, message: 'Dispute resolved', data: dispute });
});

// @desc    Get disputes relevant to logged-in user (retailer or farmer)
// @route   GET /api/v1/disputes/my-disputes
// @access  Private
const getMyDisputes = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'farmer' ? { farmer: req.user._id } : { retailer: req.user._id };
  const disputes = await Dispute.find(filter).populate('order', 'orderNumber totalAmount').sort('-createdAt');
  res.json({ success: true, data: disputes });
});

module.exports = { createDispute, getAllDisputes, resolveDispute, getMyDisputes };
