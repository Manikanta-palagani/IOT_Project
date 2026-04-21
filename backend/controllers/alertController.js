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

const allowedStatuses = new Set(['pending', 'secure', 'threat']);
const allowedTypes = new Set(['intrusion', 'fire', 'motion']);

const normalizeStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return allowedStatuses.has(normalized) ? normalized : '';
};

const normalizeType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return allowedTypes.has(normalized) ? normalized : '';
};

const resolveAlertType = ({ type, eventType, motion, intrusion }) => {
  const normalizedType = normalizeType(type) || normalizeType(eventType);

  if (normalizedType) {
    return normalizedType;
  }

  if (motion === true || intrusion === true) {
    return 'intrusion';
  }

  return 'motion';
};

const createAlert = async (req, res, next) => {
  try {
    const { deviceId, motion, intrusion, eventType, type, zone = 'Main Entrance', timestamp } = req.body;
    const hasBooleanSignal = typeof motion === 'boolean' || typeof intrusion === 'boolean';
    const resolvedType = resolveAlertType({ type, eventType, motion, intrusion });

    if (!deviceId) {
      return res.status(400).json({
        message: 'deviceId is required.',
      });
    }

    if (!hasBooleanSignal && !eventType && !type) {
      return res.status(400).json({
        message: 'motion or intrusion must be provided, or supply type/eventType.',
      });
    }

    const alertData = {
      deviceId,
      zone,
      type: resolvedType,
      motion: typeof motion === 'boolean' ? motion : Boolean(intrusion),
      status: 'pending',
      timestamp: parseTimestamp(timestamp),
    };

    let alertPayload;

    if (mongoose.connection.readyState === 1) {
      const alert = await Alert.create(alertData);
      alertPayload = toAlertResponse(alert);
    } else {
      alertPayload = {
        ...alertData,
        _id: `${Date.now()}`,
        id: `${Date.now()}`,
      };
      memoryAlerts.unshift(alertPayload);
    }

    emitNewAlert(alertPayload);

    return res.status(201).json({
      message: resolvedType === 'fire'
        ? 'Fire alert stored successfully'
        : 'Possible theft attempt near secured area stored successfully',
      alert: alertPayload,
    });
  } catch (error) {
    next(error);
  }
};

const getAlerts = async (req, res, next) => {
  try {
    const status = normalizeStatus(req.query.status) || 'pending';
    const alerts = mongoose.connection.readyState === 1
      ? await Alert.find({ status }).sort({ timestamp: -1 }).lean()
      : memoryAlerts.filter((alert) => alert.status === status);

    return res.status(200).json({
      count: alerts.length,
      alerts: alerts.map((alert) => toAlertResponse(alert)),
    });
  } catch (error) {
    next(error);
  }
};

const toAlertResponse = (alert) => {
  if (!alert) {
    return null;
  }

  const plainAlert = typeof alert.toObject === 'function' ? alert.toObject() : alert;
  const id = plainAlert._id ? plainAlert._id.toString() : plainAlert.id;

  return {
    ...plainAlert,
    id,
    _id: id,
  };
};

const updateAlertStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const status = normalizeStatus(req.body.status);

    if (!status || status === 'pending') {
      return res.status(400).json({ message: 'status must be secure or threat' });
    }

    const hasMemoryAlert = memoryAlerts.some((alert) => alert.id === id || alert._id === id);
    if (!mongoose.Types.ObjectId.isValid(id) && !hasMemoryAlert) {
      return res.status(400).json({ message: 'Invalid alert id' });
    }

    if (mongoose.connection.readyState === 1) {
      const alert = await Alert.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true }
      ).lean();

      if (!alert) {
        return res.status(404).json({ message: 'Alert not found' });
      }

      return res.status(200).json({
        message: 'Alert status updated successfully',
        alert: toAlertResponse(alert),
      });
    }

    const alertIndex = memoryAlerts.findIndex((alert) => alert.id === id || alert._id === id);

    if (alertIndex === -1) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    memoryAlerts[alertIndex] = {
      ...memoryAlerts[alertIndex],
      status,
    };

    return res.status(200).json({
      message: 'Alert status updated successfully',
      alert: toAlertResponse(memoryAlerts[alertIndex]),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAlert,
  getAlerts,
  updateAlertStatus,
};
