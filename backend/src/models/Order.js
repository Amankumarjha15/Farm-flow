const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: String,
    currentLocation: String,
    eta: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    produce: { type: mongoose.Schema.Types.ObjectId, ref: 'Produce', required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cropName: String,
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const ORDER_STATUSES = [
  'placed',
  'payment_pending',
  'payment_completed',
  'ready_for_shipment',
  'accepted_by_logistics',
  'ready_to_ship',
  'shipped',
  'on_the_way',
  'delivered',
  'cancelled',
  'disputed',
];

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    shippingAddress: {
      line1: String,
      city: String,
      state: String,
      pincode: String,
    },
    status: { type: String, enum: ORDER_STATUSES, default: 'placed', index: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },

    // Logistics assignment
    logisticsPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    logisticsAssignedAt: Date,
    expectedDeliveryDate: Date,
    expectedDeliveryTime: String,
    pickupMessage: String,

    timeline: [timelineEventSchema],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

orderSchema.index({ status: 1, logisticsPartner: 1 });

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
