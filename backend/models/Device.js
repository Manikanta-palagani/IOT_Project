const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    zone: {
      type: String,
      default: 'Main Entrance',
      trim: true,
    },
    status: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline',
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    lastIntrusionAt: {
      type: Date,
      default: null,
    },
    lastPayload: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'devices',
  }
);

deviceSchema.index({ deviceId: 1 }, { unique: true });

module.exports = mongoose.model('Device', deviceSchema);