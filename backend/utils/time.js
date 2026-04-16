const formatReadableTimestamp = (value) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
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

module.exports = {
  formatReadableTimestamp,
};