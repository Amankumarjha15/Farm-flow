const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    produce: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Produce' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Wishlist', wishlistSchema);
