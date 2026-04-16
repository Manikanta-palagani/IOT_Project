import { formatDateTime, isFireEvent, isIntrusionEvent } from '../lib/security';

const EventTimeline = ({ events }) => {
  const getEventLabel = (event) => {
    if (isFireEvent(event)) {
      return 'Critical fire detected in room';
    }

    if (!isIntrusionEvent(event)) {
      return 'Heartbeat';
    }

    const zone = (event.zone || '').toLowerCase();

    if (zone.includes('locker')) {
      return 'Someone is trying to open your locker';
    }

    if (zone.includes('restricted')) {
      return 'Intruder near restricted zone';
    }

    if (zone.includes('door')) {
      return 'A suspicious person is attempting to access your locked room';
    }

    return 'Possible theft attempt near secured area';
  };

  return (
    <div className="space-y-3">
      {events.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/55">
          No security events recorded yet.
        </div>
      ) : (
        events.map((event) => (
          <article key={event.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/20 hover:bg-white/7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className={`inline-flex rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.24em] ${isFireEvent(event) ? 'border border-red-300/40 bg-red-500/20 text-red-50' : isIntrusionEvent(event) ? 'border border-red-400/30 bg-red-500/15 text-red-100' : 'border border-emerald-400/30 bg-emerald-500/15 text-emerald-100'}`}>
                  {isFireEvent(event) ? '🔥 FIRE ALERT' : isIntrusionEvent(event) ? 'Suspicious Activity' : 'Heartbeat'}
                </div>
                <h3 className={`mt-3 text-base font-semibold ${isFireEvent(event) ? 'text-red-50' : 'text-white'}`}>{isFireEvent(event) ? `🔥 ${getEventLabel(event)}` : isIntrusionEvent(event) ? `⚠ ${getEventLabel(event)}` : '🟢 Area Secure'}</h3>
                <p className="mt-1 text-sm text-white/65">Zone: {event.zone} · Device: {event.deviceId}</p>
              </div>
              <p className="text-sm text-white/50">{formatDateTime(event.timestamp, event.displayTimestamp)}</p>
            </div>
          </article>
        ))
      )}
    </div>
  );
};

export default EventTimeline;