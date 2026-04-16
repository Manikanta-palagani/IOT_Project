import { formatDateTime } from '../lib/security';

const FireAlertCard = ({ alert, onClose }) => {
  if (!alert) {
    return null;
  }

  const zone = alert.zone || 'Main Entrance';
  const message = alert.statusMessage || 'Fire detected near secured area';

  return (
    <div className="pointer-events-auto fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.34),transparent_32%),linear-gradient(180deg,rgba(17,5,5,0.98),rgba(7,7,10,0.99))] px-4 py-4 text-white sm:py-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.28),transparent_55%)] opacity-90" />
      <div className="pointer-events-none absolute inset-0 border-4 border-red-500/45 animate-pulse" />
      <div className="relative w-full max-w-4xl rounded-[32px] border border-red-400/40 bg-[linear-gradient(180deg,rgba(36,10,10,0.98),rgba(7,10,15,0.98))] p-5 shadow-[0_0_120px_rgba(249,115,22,0.4)] sm:p-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-pulse" />
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-3 rounded-full border border-red-400/35 bg-red-500/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-red-50">
              <span className="h-3 w-3 rounded-full bg-orange-400 shadow-[0_0_18px_rgba(251,146,60,0.95)] blink-badge" />
              FIRE ALERT
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-orange-200/80">Emergency notification</p>
              <h2 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">🔥 FIRE ALERT</h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-orange-50/95">Critical fire detected in room.</p>
            <p className="max-w-2xl text-base leading-7 text-white/70">Evacuate immediately and check the secured area.</p>
            <p className="max-w-2xl text-sm leading-6 text-white/50">The fire event was captured by the backend in real time and propagated through Socket.IO without requiring a page refresh.</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-red-200/80">Current time</p>
                <p className="mt-2 text-lg font-semibold text-white">{formatDateTime(alert.timestamp, alert.displayTimestamp)}</p>
              </div>
              <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-red-200/80">Status</p>
                <p className="mt-2 text-lg font-semibold text-white">🔥 FIRE ALERT</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Zone</p>
                <p className="mt-2 text-lg font-semibold text-white">{zone}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Device</p>
                <p className="mt-2 text-lg font-semibold text-white">{alert.deviceId}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-[28px] border border-red-400/25 bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.14),transparent_55%),rgba(127,29,29,0.18)] p-4 shadow-[inset_0_0_50px_rgba(249,115,22,0.12)] sm:p-5">
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-white/50">Situation</p>
                <p className="mt-2 text-2xl font-semibold text-orange-100">Critical fire detected in room</p>
                <p className="mt-3 text-sm leading-7 text-white/65">{message}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-white/50">Device state</p>
                <p className="mt-2 text-sm leading-7 text-white/65">
                  Device ID: <span className="font-semibold text-white">{alert.deviceId}</span>
                </p>
                <p className="mt-1 text-sm leading-7 text-white/65">
                  Zone: <span className="font-semibold text-white">{zone}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-2xl border border-orange-300/30 bg-orange-500/20 px-4 py-4 text-sm font-semibold uppercase tracking-[0.28em] text-orange-50 transition hover:bg-orange-500/30 touch-manipulation"
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