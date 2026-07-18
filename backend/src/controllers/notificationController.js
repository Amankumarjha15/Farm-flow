const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/ApiError');
const Notification = require('../models/Notification');

const getMyNotifications = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id }).sort('-createdAt').skip((page - 1) * limit).limit(limit),
    Notification.countDocuments({ user: req.user._id }),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  res.json({ success: true, data: items, unreadCount, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw new ApiError(404, 'Notification not found');
  res.json({ success: true, data: notification });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: 'All notifications marked as read' });
});

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
