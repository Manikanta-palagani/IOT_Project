let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;
  return ioInstance;
};

const emitSecurityEvent = (event) => {
  if (ioInstance) {
    ioInstance.emit('security:event', event);
  }
};

const emitNewAlert = (alert) => {
  if (ioInstance) {
    ioInstance.emit('new-alert', alert);
  }
};

const emitDashboardSnapshot = (snapshot) => {
  if (ioInstance) {
    ioInstance.emit('security:snapshot', snapshot);
  }
};

const emitSecurityEventDeleted = (payload) => {
  if (ioInstance) {
    ioInstance.emit('security:event-deleted', payload);
  }
};

const emitSecurityEventsCleared = (payload) => {
  if (ioInstance) {
    ioInstance.emit('security:events-cleared', payload);
  }
};

module.exports = {
  initSocket,
  emitNewAlert,
  emitSecurityEvent,
  emitDashboardSnapshot,
  emitSecurityEventDeleted,
  emitSecurityEventsCleared,
};
