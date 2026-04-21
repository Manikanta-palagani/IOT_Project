import { formatDateTime } from '../lib/security';

const SecurityStatusPanel = ({ intrusionActive, fireActive, activeZone, latestAlertTime, alertCount, deviceId }) => {
  const isFireActive = Boolean(fireActive);
  const isIntrusionActive = Boolean(intrusionActive && !isFireActive);

  return (
    <aside className="xl:sticky xl:top-24 z-40 w-full rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_16px_50px_rgba(15,23,42,0.08)]">
      <div className={`rounded-2xl border px-4 py-3 ${isFireActive ? 'emergency-glow border-rose-200 bg-rose-50 text-rose-700 blink-badge' : isIntrusionActive ? 'emergency-glow border-amber-200 bg-amber-50 text-amber-700 blink-badge' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
        <p className="text-xs uppercase tracking-[0.28em] opacity-80">Live status</p>
        <p className="mt-2 text-lg font-semibold">{isFireActive ? '🔥 FIRE ALERT' : isIntrusionActive ? '🔴 THREAT ACTIVE' : '🟢 AREA SECURE'}</p>
      </div>

      <div className="mt-4 space-y-3 text-sm text-slate-600">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-slate-500">Active zone</p>
          <p className="mt-1 font-semibold text-slate-900">{activeZone}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-slate-500">Latest alert time</p>
          <p className="mt-1 font-semibold text-slate-900">{formatDateTime(latestAlertTime)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-slate-500">Security alerts</p>
          <p className="mt-1 font-semibold text-slate-900">{alertCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-slate-500">Device</p>
          <p className="mt-1 font-semibold text-slate-900">{deviceId}</p>
        </div>
      </div>
    </aside>
  );
};

export default SecurityStatusPanel;