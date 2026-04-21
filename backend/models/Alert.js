const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      trim: true,
    },
    zone: {
      type: String,
      required: true,
      trim: true,
      default: 'Main Entrance',
    },
    type: {
      type: String,
      required: true,
      trim: true,
      enum: ['intrusion', 'fire', 'motion'],
      default: 'intrusion',
    },
    motion: {
      type: Boolean,
      required: true,
      default: false,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'secure', 'threat'],
      default: 'pending',
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
alertSchema.index({ status: 1, timestamp: -1 });

module.exports = mongoose.model('Alert', alertSchema);
