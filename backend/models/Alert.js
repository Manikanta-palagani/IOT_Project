const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      trim: true,
    },
    motion: {
      type: Boolean,
      required: true,
      default: false,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    versionKey: false,
    collection: process.env.MONGODB_COLLECTION || 'alerts',
  }
);

alertSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Alert', alertSchema);
