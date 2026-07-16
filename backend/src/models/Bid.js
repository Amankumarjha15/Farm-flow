const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema(
  {
    produce: { type: mongoose.Schema.Types.ObjectId, ref: 'Produce', required: true, index: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    proposedPrice: { type: Number, required: true, min: 0 },
    message: { type: String, maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'countered', 'expired'],
      default: 'pending',
      index: true,
    },
    counterPrice: { type: Number },
  },
  { timestamps: true }
);

bidSchema.index({ produce: 1, status: 1 });

module.exports = mongoose.model('Bid', bidSchema);
