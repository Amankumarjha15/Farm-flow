const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
  'new_order',
  'bid_received',
  'bid_accepted',
  'bid_rejected',
  'payment_success',
  'payment_failed',
  'logistics_assigned',
  'delivery_available',
  'status_updated',
  'dispute_raised',
  'dispute_resolved',
  'payout_completed',
];

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: String,
    relatedOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
