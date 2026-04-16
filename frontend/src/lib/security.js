const formatDateTime = (value, displayValue = '') => {
  if (displayValue) {
    return displayValue;
  }

  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const formatted = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);

  return formatted.replace(/\b(am|pm)\b/i, (match) => match.toUpperCase());
};

const formatRelativeTime = (value) => {
  if (!value) {
    return 'Waiting for first signal';
  }

  const diffMs = Date.now() - new Date(value).getTime();

  if (Number.isNaN(diffMs)) {
    return 'Waiting for first signal';
  }

  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) {
    return 'just now';
  }

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

const isFireEvent = (event) => event?.eventType === 'fire';

const isIntrusionEvent = (event) => event?.eventType === 'intrusion' || (!event?.eventType && event?.intrusion === true);

const isAlertEvent = (event) => isFireEvent(event) || isIntrusionEvent(event);

const bucketByHour = (events) => {
  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));

  events.forEach((event) => {
    const date = new Date(event.timestamp);
    if (Number.isNaN(date.getTime())) {
      return;
    }
    const hourText = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      hour12: false,
    }).format(date);
    const hour = Number(hourText);

    if (Number.isInteger(hour) && hours[hour]) {
      hours[hour].count += isAlertEvent(event) ? 1 : 0;
    }
  });

  return hours;
};

const bucketByDay = (events) => {
  const days = [];
  const today = new Date();

  const getIstDateKey = (date) => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  };

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    const key = getIstDateKey(date);
    days.push({
      key,
      label: new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short' }).format(date),
      count: 0,
    });
  }

  events.forEach((event) => {
    const date = new Date(event.timestamp);
    if (Number.isNaN(date.getTime())) {
      return;
    }

    const key = getIstDateKey(date);
    const bucket = days.find((item) => item.key === key);
    if (bucket) {
      bucket.count += isAlertEvent(event) ? 1 : 0;
    }
  });

  return days;
};

const deriveSecurityState = (events, devices) => {
  const latestEvent = events[0] || null;
  const latestIntrusion = events.find((event) => isIntrusionEvent(event)) || null;
  const latestFire = events.find((event) => isFireEvent(event)) || null;
  const latestAlert = events.find((event) => isAlertEvent(event)) || null;
  const latestDevice = devices[0] || null;

  const latestTimestamp = latestEvent?.timestamp || latestDevice?.lastSeenAt || null;
  const latestAlertTimestamp = latestAlert?.timestamp || null;
  const intrusionActive = Boolean(
    latestIntrusion && Date.now() - new Date(latestIntrusion.timestamp).getTime() < 5 * 60 * 1000
  );
  const fireActive = Boolean(
    latestFire && Date.now() - new Date(latestFire.timestamp).getTime() < 5 * 60 * 1000
  );
  const deviceOnline = Boolean(
    latestDevice && Date.now() - new Date(latestDevice.lastSeenAt).getTime() < 90 * 1000
  );

  return {
    latestEvent,
    latestIntrusion,
    latestFire,
    latestAlert,
    latestTimestamp,
    latestAlertTimestamp,
    intrusionActive,
    fireActive,
    deviceOnline,
    zone: latestEvent?.zone || latestDevice?.zone || 'Main Entrance',
    deviceId: latestEvent?.deviceId || latestDevice?.deviceId || 'esp32-01',
  };
};

export { bucketByDay, bucketByHour, deriveSecurityState, formatDateTime, formatRelativeTime, isAlertEvent, isFireEvent, isIntrusionEvent };