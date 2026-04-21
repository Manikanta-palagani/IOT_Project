import { formatDateTime } from '../lib/security';

const AlertModal = ({ alert, onResolve, resolvingStatus = '' }) => {
  if (!alert) {
    return null;
  }

  const zone = alert.zone || 'Main Entrance';
  const typeLabel = String(alert.type || alert.eventType || 'intrusion').toLowerCase();
  const message =
    typeLabel === 'fire'
      ? 'Critical fire detected in room.'
      : typeLabel === 'motion'
        ? 'Motion detected near the secured area.'
        : 'Possible theft attempt near secured area.';

  return (
    <div className="pointer-events-auto fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-950/30 px-4 py-6 backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-900/10 via-transparent to-slate-900/20" />
      <div className="animate-fade-scale-in relative w-full max-w-2xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.18)]">
        <div className="h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-rose-500" />
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Live alert</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">Security alert</h2>
            </div>
            <div className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">
              Pending
            </div>
          </div>

          <p className="mt-4 text-base leading-7 text-slate-600">{message}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Zone</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{zone}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Device</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{alert.deviceId}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Detected at</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{formatDateTime(alert.timestamp, alert.displayTimestamp)}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onResolve?.('secure')}
              disabled={Boolean(resolvingStatus)}
              className="rounded-2xl border border-emerald-200 bg-emerald-500 px-4 py-4 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {resolvingStatus === 'secure' ? 'Updating...' : "It\'s Me"}
            </button>
            <button
              type="button"
              onClick={() => onResolve?.('threat')}
              disabled={Boolean(resolvingStatus)}
              className="rounded-2xl border border-rose-200 bg-rose-500 px-4 py-4 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {resolvingStatus === 'threat' ? 'Updating...' : 'Confirm Threat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;