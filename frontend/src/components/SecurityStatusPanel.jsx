import { formatDateTime } from '../lib/security';

const SecurityStatusPanel = ({ intrusionActive, fireActive, activeZone, latestAlertTime, alertCount, deviceId }) => {
  const isFireActive = Boolean(fireActive);
  const isIntrusionActive = Boolean(intrusionActive && !isFireActive);

  return (
    <aside className="fixed right-4 top-24 z-40 w-[min(92vw,320px)] rounded-[28px] border border-white/10 bg-slate-950/92 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:right-6">
      <div className={`rounded-2xl border px-4 py-3 ${isFireActive ? 'emergency-glow border-red-300/40 bg-red-500/20 text-red-50 blink-badge' : isIntrusionActive ? 'emergency-glow border-red-400/30 bg-red-500/15 text-red-100 blink-badge' : 'border-emerald-400/25 bg-emerald-500/10 text-emerald-100'}`}>
        <p className="text-xs uppercase tracking-[0.28em] opacity-80">Live status</p>
        <p className="mt-2 text-lg font-semibold">{isFireActive ? '🔥 FIRE ALERT' : isIntrusionActive ? '🔴 THREAT ACTIVE' : '🟢 AREA SECURE'}</p>
      </div>

      <div className="mt-4 space-y-3 text-sm text-white/72">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-white/45">Active zone</p>
          <p className="mt-1 font-semibold text-white">{activeZone}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-white/45">Latest alert time</p>
          <p className="mt-1 font-semibold text-white">{formatDateTime(latestAlertTime)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-white/45">Security alerts</p>
          <p className="mt-1 font-semibold text-white">{alertCount}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-white/45">Device</p>
          <p className="mt-1 font-semibold text-white">{deviceId}</p>
        </div>
      </div>
    </aside>
  );
};

export default SecurityStatusPanel;