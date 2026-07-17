const mongoose = require('mongoose');

const produceSchema = new mongoose.Schema(
  {
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    cropName: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    description: { type: String, trim: true, maxlength: 2000 },
    quantity: { type: Number, required: true, min: 0 },
    availableQuantity: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: ['kg', 'quintal', 'ton', 'dozen', 'piece'], default: 'kg' },
    price: { type: Number, required: true, min: 0 },
    location: { type: String, required: true, trim: true, index: true },
    harvestDate: { type: Date, required: true },
    isOrganic: { type: Boolean, default: false },
    qualityGrade: { type: String, enum: ['A', 'B', 'C', 'Premium', 'Standard'], default: 'Standard' },
    images: [{ url: String, publicId: String }],
    status: {
      type: String,
      enum: ['available', 'low_stock', 'out_of_stock', 'inactive'],
      default: 'available',
      index: true,
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

produceSchema.index({ cropName: 'text', description: 'text', location: 'text' });
produceSchema.index({ category: 1, location: 1, price: 1 });

produceSchema.pre('save', function syncStatus(next) {
  if (this.isModified('availableQuantity')) {
    if (this.availableQuantity <= 0) this.status = 'out_of_stock';
    else if (this.availableQuantity < this.quantity * 0.1) this.status = 'low_stock';
    else if (this.status !== 'inactive') this.status = 'available';
  }
  next();
});

module.exports = mongoose.model('Produce', produceSchema);
