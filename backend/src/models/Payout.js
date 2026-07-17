const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema(
  {
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'eligible', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    eligibleAt: Date,
    completedAt: Date,
    transactionRef: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payout', payoutSchema);
