const Alert = require('../models/Alert');
const { emitNewAlert } = require('../config/socket');
const mongoose = require('mongoose');

const memoryAlerts = [];

const parseTimestamp = (value) => {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const createAlert = async (req, res, next) => {
  try {
    const { deviceId, motion, timestamp } = req.body;

    if (!deviceId || typeof motion !== 'boolean') {
      return res.status(400).json({
        message: 'deviceId and motion are required. motion must be boolean.',
      });
    }

    const alertData = {
      deviceId,
      motion,
      timestamp: parseTimestamp(timestamp),
    };

    let alertPayload;

    if (mongoose.connection.readyState === 1) {
      const alert = await Alert.create(alertData);
      alertPayload = alert.toObject();
    } else {
      alertPayload = {
        ...alertData,
        _id: `${Date.now()}`,
      };
      memoryAlerts.unshift(alertPayload);
    }

    emitNewAlert(alertPayload);

    return res.status(201).json({
      message: motion ? 'Possible theft attempt near secured area stored successfully' : 'Heartbeat stored successfully',
      alert: alertPayload,
    });
  } catch (error) {
    next(error);
  }
};

const getAlerts = async (req, res, next) => {
  try {
    const alerts = mongoose.connection.readyState === 1
      ? await Alert.find().sort({ timestamp: -1 }).lean()
      : memoryAlerts;

    return res.status(200).json({
      count: alerts.length,
      alerts,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAlert,
  getAlerts,
};
