const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: String, enum: ['stripe', 'razorpay', 'mock'], required: true },
    providerPaymentId: String,
    providerOrderId: String,
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending',
      index: true,
    },
    refundAmount: { type: Number, default: 0 },
    invoiceUrl: String,
    rawResponse: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
