const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/ApiError');
const Payout = require('../models/Payout');

// @desc    Farmer's payout summary + history
// @route   GET /api/v1/payouts/my-payouts
// @access  Private (farmer)
const getMyPayouts = asyncHandler(async (req, res) => {
  const farmerId = req.user._id;

  const [pending, eligible, completed, all] = await Promise.all([
    Payout.aggregate([
      { $match: { farmer: farmerId, status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Payout.aggregate([
      { $match: { farmer: farmerId, status: 'eligible' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Payout.aggregate([
      { $match: { farmer: farmerId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Payout.find({ farmer: farmerId }).populate('order', 'orderNumber').sort('-createdAt'),
  ]);

  res.json({
    success: true,
    data: {
      pendingAmount: pending[0]?.total || 0,
      eligibleAmount: eligible[0]?.total || 0,
      totalEarnings: completed[0]?.total || 0,
      transactions: all,
    },
  });
});

// @desc    Admin: list all payouts, optionally filtered by status
// @route   GET /api/v1/payouts/admin
// @access  Private (admin)
const getAllPayouts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Payout.find(filter)
      .populate('farmer', 'name email')
      .populate('order', 'orderNumber')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    Payout.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// @desc    Admin: mark an eligible payout as processed/completed
// @route   PATCH /api/v1/payouts/:id/complete
// @access  Private (admin)
const completePayout = asyncHandler(async (req, res) => {
  const payout = await Payout.findById(req.params.id);
  if (!payout) throw new ApiError(404, 'Payout not found');
  if (payout.status !== 'eligible') throw new ApiError(400, `Payout must be 'eligible' to complete (currently '${payout.status}')`);

  payout.status = 'completed';
  payout.completedAt = new Date();
  payout.transactionRef = req.body.transactionRef || `MANUAL-${Date.now()}`;
  await payout.save();

  const { notify } = require('../services/notificationService');
  await notify(req, {
    userId: payout.farmer,
    type: 'payout_completed',
    title: 'Payout completed',
    message: `Your payout of ₹${payout.amount} has been processed.`,
  });

  res.json({ success: true, message: 'Payout marked as completed', data: payout });
});

module.exports = { getMyPayouts, getAllPayouts, completePayout };
