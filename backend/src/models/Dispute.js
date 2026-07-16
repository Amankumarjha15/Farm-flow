const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    complaint: { type: String, required: true, maxlength: 2000 },
    images: [{ url: String, publicId: String }],
    status: {
      type: String,
      enum: ['open', 'under_review', 'refund', 'partial_refund', 'rejected', 'replacement'],
      default: 'open',
      index: true,
    },
    resolutionNote: String,
    refundAmount: Number,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Dispute', disputeSchema);
