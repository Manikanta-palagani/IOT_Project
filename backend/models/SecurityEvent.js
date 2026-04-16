const mongoose = require('mongoose');

const securityEventSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      trim: true,
    },
    eventType: {
      type: String,
      enum: ['intrusion', 'fire'],
      default: null,
      trim: true,
    },
    intrusion: {
      type: Boolean,
      required: true,
      default: false,
    },
    zone: {
      type: String,
      required: true,
      trim: true,
      default: 'Main Entrance',
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    statusMessage: {
      type: String,
      required: true,
    },
  },
  {
    versionKey: false,
    collection: 'security_events',
  }
);

securityEventSchema.index({ timestamp: -1 });
securityEventSchema.index({ intrusion: 1, timestamp: -1 });
securityEventSchema.index({ eventType: 1, timestamp: -1 });

module.exports = mongoose.model('SecurityEvent', securityEventSchema);