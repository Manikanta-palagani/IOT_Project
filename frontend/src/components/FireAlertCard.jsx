import { formatDateTime } from '../lib/security';

const FireAlertCard = ({ alert, onClose }) => {
  if (!alert) {
    return null;
  }

  const zone = alert.zone || 'Main Entrance';
  const message = alert.statusMessage || 'Fire detected near secured area';

  return (
    <div className="pointer-events-none fixed top-5 right-5 z-[110] w-[min(22rem,calc(100vw-2rem))]">
      <div className="relative pointer-events-auto animate-fade-scale-in rounded-2xl border border-rose-200 bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Close fire alert"
        >
          ✕
        </button>

        <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-rose-700">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          Fire alert
        </div>
        <p className="mt-4 text-base font-semibold leading-7 text-slate-900">🔥 Fire detected in {zone}</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">{message}</p>

        <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 p-3">
          <p className="text-xs uppercase tracking-[0.24em] text-rose-500">Detected at</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(alert.timestamp, alert.displayTimestamp)}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl border border-rose-200 bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
        >
          Close alert
        </button>
      </div>
    </div>
  );
};

export default FireAlertCard;