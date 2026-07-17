const mongoose = require('mongoose');

// Deliberately a single-document collection: there's only ever one platform settings record.
const settingsSchema = new mongoose.Schema(
  {
    platformCommissionPercent: { type: Number, default: 5, min: 0, max: 100 },
    minimumOrderAmount: { type: Number, default: 0, min: 0 },
    supportEmail: { type: String, default: 'support@farmflow.app' },
    supportPhone: { type: String, default: '' },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: 'Farm Flow is undergoing scheduled maintenance. Please check back shortly.' },
    allowNewRegistrations: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Always returns (and lazily creates) the single settings document.
settingsSchema.statics.getSingleton = async function getSingleton() {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

module.exports = mongoose.model('Settings', settingsSchema);
