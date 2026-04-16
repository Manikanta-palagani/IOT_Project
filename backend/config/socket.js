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
  emitSecurityEvent,
  emitDashboardSnapshot,
  emitSecurityEventDeleted,
  emitSecurityEventsCleared,
};
