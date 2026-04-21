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
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          No security events recorded yet.
        </div>
      ) : (
        events.map((event) => (
          <article key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className={`inline-flex rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.24em] ${isFireEvent(event) ? 'border border-rose-200 bg-rose-100 text-rose-700' : isIntrusionEvent(event) ? 'border border-amber-200 bg-amber-100 text-amber-700' : 'border border-emerald-200 bg-emerald-100 text-emerald-700'}`}>
                  {isFireEvent(event) ? '🔥 FIRE ALERT' : isIntrusionEvent(event) ? 'Suspicious Activity' : 'Heartbeat'}
                </div>
                <h3 className={`mt-3 text-base font-semibold ${isFireEvent(event) ? 'text-rose-700' : 'text-slate-900'}`}>{isFireEvent(event) ? `🔥 ${getEventLabel(event)}` : isIntrusionEvent(event) ? `⚠ ${getEventLabel(event)}` : '🟢 Area Secure'}</h3>
                <p className="mt-1 text-sm text-slate-600">Zone: {event.zone}</p>
              </div>
              <p className="text-sm text-slate-500">{formatDateTime(event.timestamp, event.displayTimestamp)}</p>
            </div>
          </article>
        ))
      )}
    </div>
  );
};

export default EventTimeline;