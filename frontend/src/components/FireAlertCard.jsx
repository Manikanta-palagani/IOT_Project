import { formatDateTime } from '../lib/security';

const FireAlertCard = ({ alert, onClose }) => {
  if (!alert) {
    return null;
  }

  const zone = alert.zone || 'Main Entrance';
  const message = alert.statusMessage || 'Fire detected near secured area';

  return (
    <div className="pointer-events-auto fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-slate-900/35 px-4 py-4 sm:py-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.14),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 border-4 border-rose-300/40 animate-pulse" />
      <div className="relative w-full max-w-4xl rounded-[32px] border border-rose-200 bg-white p-5 shadow-[0_24px_90px_rgba(15,23,42,0.18)] sm:p-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-pulse" />
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-3 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs uppercase tracking-[0.3em] text-rose-700">
              <span className="h-3 w-3 rounded-full bg-orange-400 shadow-[0_0_18px_rgba(251,146,60,0.55)] blink-badge" />
              FIRE ALERT
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Emergency notification</p>
              <h2 className="mt-3 text-4xl font-semibold text-slate-900 sm:text-5xl">🔥 FIRE ALERT</h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-slate-800">Critical fire detected in room.</p>
            <p className="max-w-2xl text-base leading-7 text-slate-600">Evacuate immediately and check the secured area.</p>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">The fire event was captured by the backend and surfaced automatically without requiring a manual refresh.</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-rose-500">Current time</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{formatDateTime(alert.timestamp, alert.displayTimestamp)}</p>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-rose-500">Status</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">🔥 FIRE ALERT</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Zone</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{zone}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Device</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{alert.deviceId}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-[28px] border border-slate-200 bg-slate-50 p-4 shadow-[inset_0_0_30px_rgba(15,23,42,0.04)] sm:p-5">
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Situation</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">Critical fire detected in room</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{message}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Device state</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Device ID: <span className="font-semibold text-slate-900">{alert.deviceId}</span>
                </p>
                <p className="mt-1 text-sm leading-7 text-slate-600">
                  Zone: <span className="font-semibold text-slate-900">{zone}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-2xl border border-rose-200 bg-rose-600 px-4 py-4 text-sm font-semibold uppercase tracking-[0.28em] text-white transition hover:bg-rose-700 touch-manipulation"
            >
              Acknowledge Fire Alert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FireAlertCard;