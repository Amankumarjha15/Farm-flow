const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const Order = require('../models/Order');
const Produce = require('../models/Produce');
const Payment = require('../models/Payment');
const Payout = require('../models/Payout');
const Dispute = require('../models/Dispute');

// @desc    Analytics dashboard summary (counts, revenue, charts data)
// @route   GET /api/v1/admin/dashboard
// @access  Private (admin)
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalFarmers, totalRetailers, totalLogistics,
    totalOrders, pendingOrders, completedOrders,
    revenueAgg, pendingPayoutsAgg, openDisputes, totalTransactions,
    latestOrders, latestUsers, ordersByStatus, revenueByMonth,
  ] = await Promise.all([
    User.countDocuments({ role: 'farmer', isDeleted: false }),
    User.countDocuments({ role: 'retailer', isDeleted: false }),
    User.countDocuments({ role: 'logistics', isDeleted: false }),
    Order.countDocuments({ isDeleted: false }),
    Order.countDocuments({ isDeleted: false, status: { $nin: ['delivered', 'cancelled'] } }),
    Order.countDocuments({ isDeleted: false, status: 'delivered' }),
    Payment.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Payout.aggregate([{ $match: { status: { $in: ['pending', 'eligible'] } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Dispute.countDocuments({ status: { $in: ['open', 'under_review'] } }),
    Payment.countDocuments({ status: 'success' }),
    Order.find({ isDeleted: false }).populate('retailer', 'name').sort('-createdAt').limit(10),
    User.find({ isDeleted: false }).sort('-createdAt').limit(10).select('name email role createdAt'),
    Order.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, total: { $sum: '$amount' } } },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      totals: {
        farmers: totalFarmers,
        retailers: totalRetailers,
        logisticsPartners: totalLogistics,
        orders: totalOrders,
        pendingOrders,
        completedOrders,
        revenue: revenueAgg[0]?.total || 0,
        pendingPayouts: pendingPayoutsAgg[0]?.total || 0,
        openDisputes,
        transactions: totalTransactions,
      },
      charts: { ordersByStatus, revenueByMonth },
      latestOrders,
      latestUsers,
    },
  });
});

// @desc    List/filter users by role (farmers, retailers, logistics)
// @route   GET /api/v1/admin/users?role=farmer
// @access  Private (admin)
const manageUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  const filter = { isDeleted: false };
  if (role) filter.role = role;
  if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];

  const [items, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) } });
});

// @desc    Verify a logistics partner (or farmer, if org requires it)
// @route   PATCH /api/v1/admin/users/:id/verify
// @access  Private (admin)
const verifyUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  user.isVerified = true;
  await user.save();
  res.json({ success: true, message: 'User verified', data: user });
});

// @desc    Activate/deactivate a user account
// @route   PATCH /api/v1/admin/users/:id/toggle-active
// @access  Private (admin)
const toggleUserActive = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, data: user });
});

// @desc    Soft-delete a user
// @route   DELETE /api/v1/admin/users/:id
// @access  Private (admin)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  user.isDeleted = true;
  user.isActive = false;
  await user.save();
  res.json({ success: true, message: 'User removed' });
});

// @desc    Admin view of all produce listings (including moderation)
// @route   GET /api/v1/admin/produce
// @access  Private (admin)
const manageProduce = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const filter = { isDeleted: false };
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    Produce.find(filter).populate('farmer', 'name email').sort('-createdAt').skip((page - 1) * limit).limit(Number(limit)),
    Produce.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) } });
});

// @desc    Admin: deactivate/moderate a produce listing
// @route   PATCH /api/v1/admin/produce/:id/moderate
// @access  Private (admin)
const moderateProduce = asyncHandler(async (req, res) => {
  const produce = await Produce.findById(req.params.id);
  if (!produce) throw new ApiError(404, 'Produce not found');
  produce.status = req.body.status || 'inactive';
  await produce.save();
  res.json({ success: true, message: 'Produce listing updated', data: produce });
});

// @desc    Admin view of all payments
// @route   GET /api/v1/admin/payments
// @access  Private (admin)
const managePayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, provider } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (provider) filter.provider = provider;

  const [items, total] = await Promise.all([
    Payment.find(filter).populate('retailer', 'name email').populate('order', 'orderNumber').sort('-createdAt').skip((page - 1) * limit).limit(Number(limit)),
    Payment.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) } });
});

// @desc    Export orders as CSV
// @route   GET /api/v1/admin/export/orders
// @access  Private (admin)
const exportOrdersCsv = asyncHandler(async (req, res) => {
  const orders = await Order.find({ isDeleted: false }).populate('retailer', 'name email').sort('-createdAt');

  const header = 'Order Number,Retailer,Email,Total Amount,Status,Created At\n';
  const rows = orders
    .map((o) => `${o.orderNumber},${o.retailer?.name || ''},${o.retailer?.email || ''},${o.totalAmount},${o.status},${o.createdAt.toISOString()}`)
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="orders_export.csv"');
  res.send(header + rows);
});

module.exports = {
  getDashboardStats,
  manageUsers,
  verifyUser,
  toggleUserActive,
  deleteUser,
  manageProduce,
  moderateProduce,
  managePayments,
  exportOrdersCsv,
};
