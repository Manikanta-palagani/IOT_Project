import { formatDateTime } from '../lib/security';

const LiveAlertCard = ({ alert, onResolve, resolvingStatus = '' }) => {
  if (!alert) {
    return null;
  }

  const zone = alert.zone || 'Main Entrance';
  const typeLabel = String(alert.type || alert.eventType || 'intrusion').toLowerCase();
  const copy = typeLabel === 'fire'
    ? 'Critical fire detected in room.'
    : typeLabel === 'motion'
      ? 'Motion detected near the secured area.'
      : 'Possible theft attempt near secured area.';

  const handleResolve = async (status) => {
    if (!onResolve) {
      return;
    }

    await onResolve(status);
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/85 px-4 py-4 backdrop-blur-sm sm:py-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.25),transparent_55%)] opacity-90" />
      <div className="pointer-events-none absolute inset-0 border-4 border-red-500/45 animate-pulse" />
      <div className="emergency-glow relative w-full max-w-4xl rounded-[32px] border border-red-400/40 bg-[linear-gradient(180deg,rgba(10,10,15,0.98),rgba(4,8,18,0.98))] p-5 shadow-[0_0_120px_rgba(220,38,38,0.45)] sm:p-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse" />
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-3 rounded-full border border-red-400/35 bg-red-500/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-red-100">
              <span className="h-3 w-3 rounded-full bg-red-400 shadow-[0_0_18px_rgba(248,113,113,0.95)] blink-badge" />
              Live alert
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-red-300/80">Immediate action required</p>
              <h2 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">⚠ SECURITY ALERT</h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-red-50/90">{copy}</p>
            <p className="max-w-2xl text-base leading-7 text-white/70">Confirm whether this alert is safe or a real threat.</p>
            <p className="max-w-2xl text-sm leading-6 text-white/50">The alert was captured by the backend and surfaced automatically without requiring a manual refresh.</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-red-200/80">Current time</p>
                <p className="mt-2 text-lg font-semibold text-white">{formatDateTime(alert.timestamp, alert.displayTimestamp)}</p>
              </div>
              <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-red-200/80">Status</p>
                <p className="mt-2 text-lg font-semibold text-white">PENDING</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Zone</p>
                <p className="mt-2 text-lg font-semibold text-white">{zone}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Type</p>
                <p className="mt-2 text-lg font-semibold text-white">{typeLabel}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Device</p>
                <p className="mt-2 text-lg font-semibold text-white">{alert.deviceId}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-[28px] border border-red-400/25 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.15),transparent_55%),rgba(127,29,29,0.18)] p-4 shadow-[inset_0_0_50px_rgba(239,68,68,0.12)] sm:p-5">
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-white/50">Situation</p>
                <p className="mt-2 text-2xl font-semibold text-red-100">Confirm the alert status</p>
                <p className="mt-3 text-sm leading-7 text-white/65">Choose whether this is your presence or a confirmed threat.</p>
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
            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={() => handleResolve('secure')}
                disabled={Boolean(resolvingStatus)}
                className="w-full rounded-2xl border border-emerald-300/30 bg-emerald-500/20 px-4 py-4 text-sm font-semibold uppercase tracking-[0.28em] text-emerald-50 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60 touch-manipulation"
              >
                {resolvingStatus === 'secure' ? 'Updating...' : "It\'s Me"}
              </button>
              <button
                type="button"
                onClick={() => handleResolve('threat')}
                disabled={Boolean(resolvingStatus)}
                className="w-full rounded-2xl border border-red-300/30 bg-red-500/20 px-4 py-4 text-sm font-semibold uppercase tracking-[0.28em] text-red-50 transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-60 touch-manipulation"
              >
                {resolvingStatus === 'threat' ? 'Updating...' : 'Confirm Threat'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveAlertCard;