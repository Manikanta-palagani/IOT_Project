const StatusCard = ({ status, deviceId, lastSeenText }) => {
  const isAlerting = status !== 'CLEAR' && status !== 'AREA SECURE' && status !== 'HOME SECURE';

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl backdrop-blur">
      <p className="text-sm uppercase tracking-[0.2em] text-white/60">Device Status</p>
      <div className="mt-3 flex items-center gap-3">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-[0.2em] ${
            isAlerting
              ? 'blink-badge bg-red-500/15 text-red-200 ring-1 ring-red-400/40'
              : 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30'
          }`}
        >
          {status}
          {isAlerting ? 'SUSPICIOUS ACTIVITY' : 'AREA SECURE'}
        </span>
      </div>
      <div className="mt-4 space-y-2 text-sm text-slate-300">
        <div className="flex items-center justify-between gap-4">
          <span className="text-white/60">Device</span>
          <span className="font-medium text-white">{deviceId}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-white/60">Last Seen</span>
          <span className="font-medium text-white">{lastSeenText}</span>
        </div>
      </div>
    </div>
  );
};

export default StatusCard;
