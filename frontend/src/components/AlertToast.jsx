const AlertToast = ({ alert, onClose }) => {
  if (!alert) {
    return null;
  }

  return (
    <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-red-400/25 bg-slate-950/95 p-4 shadow-2xl shadow-red-950/30 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-red-300">Live Alert</p>
          <h3 className="mt-1 text-lg font-semibold text-white">Possible theft attempt near secured area</h3>
          <p className="mt-2 text-sm text-slate-300">
            {alert.deviceId} reported suspicious activity at {new Date(alert.timestamp).toLocaleString()}.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 px-2 py-1 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default AlertToast;
