const SecurityEvent = require('../models/SecurityEvent');
const Device = require('../models/Device');
const User = require('../models/User');
const { emitSecurityEvent, emitDashboardSnapshot, emitSecurityEventDeleted, emitSecurityEventsCleared } = require('../config/socket');
const { sendSecurityAlertEmail } = require('../utils/mailer');
const { formatReadableTimestamp } = require('../utils/time');
const mongoose = require('mongoose');

const normalizeEventType = (value) => {
  const normalizedValue = String(value || '').trim().toLowerCase();

  if (normalizedValue === 'intrusion' || normalizedValue === 'fire') {
    return normalizedValue;
  }

  return '';
};

const resolveEventType = ({ eventType, intrusion }) => {
  const normalizedEventType = normalizeEventType(eventType);

  if (normalizedEventType) {
    return normalizedEventType;
  }

  if (intrusion === true) {
    return 'intrusion';
  }

  return '';
};

const buildStatusMessage = ({ eventType, intrusion }) => {
  if (eventType === 'fire') {
    return 'Fire detected in your home';
  }

  return intrusion ? 'Possible theft attempt detected near secured area' : 'Heartbeat received';
};

const getRecipients = async () => {
  const users = await User.find({ isActive: true, broadcastEnabled: true }).lean();
  return users.map((user) => user.email);
};

const createAlert = async (req, res, next) => {
  try {
    const { deviceId, intrusion, eventType, zone = 'Main Entrance' } = req.body;
    const resolvedEventType = resolveEventType({ eventType, intrusion });
    const isFireEvent = resolvedEventType === 'fire';
    const isIntrusionEvent = resolvedEventType === 'intrusion' || (!resolvedEventType && intrusion === true);

    if (!deviceId) {
      return res.status(400).json({
        message: 'deviceId is required.',
      });
    }

    if (!resolvedEventType && typeof intrusion !== 'boolean') {
      return res.status(400).json({
        message: 'intrusion must be boolean when eventType is not provided.',
      });
    }

    if (eventType && !resolvedEventType) {
      return res.status(400).json({
        message: 'eventType must be either intrusion or fire.',
      });
    }

    const currentTime = new Date();
    const statusMessage = buildStatusMessage({ eventType: resolvedEventType, intrusion: isIntrusionEvent });

    const event = await SecurityEvent.create({
      deviceId,
      eventType: resolvedEventType || null,
      intrusion: isIntrusionEvent,
      zone,
      timestamp: currentTime,
      statusMessage,
    });

    const device = await Device.findOneAndUpdate(
      { deviceId },
      {
        $set: {
          zone,
          status: 'online',
          lastSeenAt: currentTime,
          lastPayload: req.body,
          ...(isIntrusionEvent ? { lastIntrusionAt: currentTime } : {}),
        },
      },
      { new: true, upsert: true }
    );

    const eventPayload = {
      id: event._id.toString(),
      deviceId: event.deviceId,
      eventType: event.eventType,
      intrusion: event.intrusion,
      zone: event.zone,
      timestamp: event.timestamp,
      statusMessage: event.statusMessage,
      displayTimestamp: formatReadableTimestamp(event.timestamp),
      device: device.toObject ? device.toObject() : device,
    };

    emitSecurityEvent(eventPayload);
    emitDashboardSnapshot({
      latestEvent: eventPayload,
      device,
    });

    let emailSent = false;

    if (isIntrusionEvent || isFireEvent) {
      console.log('Preparing to send security alert emails');
      console.log('Security event:', eventPayload);

      const users = await User.find({ isActive: true, broadcastEnabled: true }).lean();
      console.log('Fetched users:', users);

      let recipients = await getRecipients();
      console.log('Recipients:', recipients);

      const adminEmail = (process.env.ADMIN_SEED_EMAIL || 'palaganimani5@gmail.com').trim();

      if (!recipients.length) {
        recipients = [adminEmail];
        console.log('[SecurityController] No active broadcast recipients found; using admin fallback:', recipients);
      }

      try {
        emailSent = await sendSecurityAlertEmail(recipients, eventPayload);
        console.log('Security alert email send completed:', emailSent);
      } catch (mailError) {
        console.error('[SecurityController] Failed to send security alert email:', mailError && mailError.stack ? mailError.stack : mailError);
      }
    }

    return res.status(201).json({
      message: isFireEvent
        ? 'Fire detected in your home stored successfully'
        : isIntrusionEvent
          ? 'Possible theft attempt detected near secured area stored successfully'
          : 'Heartbeat stored successfully',
      event: eventPayload,
      device,
      emailSent,
    });
  } catch (error) {
    next(error);
  }
};

const getEvents = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 200);
    const [events, intrusionLogs, fireLogs, securityLogs] = await Promise.all([
      SecurityEvent.find().sort({ timestamp: -1 }).limit(limit).lean(),
      SecurityEvent.countDocuments({ intrusion: true }),
      SecurityEvent.countDocuments({ eventType: 'fire' }),
      SecurityEvent.countDocuments({ $or: [{ intrusion: true }, { eventType: 'fire' }] }),
    ]);
    const devices = await Device.find().sort({ updatedAt: -1 }).lean();

    return res.status(200).json({
      count: events.length,
      stats: {
        intrusionLogs,
        fireLogs,
        securityLogs,
      },
      events: events.map((event) => ({
        id: event._id.toString(),
        deviceId: event.deviceId,
        eventType: event.eventType,
        intrusion: event.intrusion,
        zone: event.zone,
        timestamp: event.timestamp,
        statusMessage: event.statusMessage,
        displayTimestamp: formatReadableTimestamp(event.timestamp),
      })),
      devices: devices.map((device) => ({
        id: device._id.toString(),
        deviceId: device.deviceId,
        zone: device.zone,
        status: device.status,
        lastSeenAt: device.lastSeenAt,
        lastIntrusionAt: device.lastIntrusionAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event id' });
    }

    const deletedEvent = await SecurityEvent.findOneAndDelete({
      _id: eventId,
      $or: [{ intrusion: true }, { eventType: 'fire' }],
    });

    if (!deletedEvent) {
      return res.status(404).json({ message: 'Security event not found' });
    }

    emitSecurityEventDeleted({
      id: deletedEvent._id.toString(),
      deviceId: deletedEvent.deviceId,
    });

    return res.status(200).json({
      message: 'Security event deleted successfully',
      id: deletedEvent._id.toString(),
    });
  } catch (error) {
    next(error);
  }
};

const deleteAllEvents = async (req, res, next) => {
  try {
    const result = await SecurityEvent.deleteMany({
      $or: [{ intrusion: true }, { eventType: 'fire' }],
    });

    emitSecurityEventsCleared({ deletedCount: result.deletedCount || 0 });

    return res.status(200).json({
      message: 'All alert records deleted successfully',
      deletedCount: result.deletedCount || 0,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAlert,
  getEvents,
  deleteEvent,
  deleteAllEvents,
};