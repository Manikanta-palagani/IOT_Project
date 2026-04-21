const AlertModal = ({ alert, onResolve, onClose, resolvingStatus = '' }) => {
  if (!alert) {
    return null;
  }

  const zone = alert.zone || 'Main Entrance';
  const eventType = String(alert.eventType || alert.type || 'intrusion').toLowerCase();
  const message = eventType === 'intrusion'
    ? `🚨 Motion detected in ${zone}`
    : `🔥 Fire detected in ${zone}`;
  const supportingCopy = eventType === 'intrusion'
    ? 'Confirm whether this is you or a real security threat.'
    : 'Confirm whether this is a real fire or a false trigger.';
  const accentTone = eventType === 'intrusion' ? 'amber' : 'rose';

  return (
    <div className="pointer-events-none fixed top-5 right-5 z-[120] w-[min(22rem,calc(100vw-2rem))]">
      <div className={`relative pointer-events-auto animate-fade-scale-in rounded-2xl border bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.18)] ${accentTone === 'amber' ? 'border-amber-200' : 'border-rose-200'}`}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Close alert"
        >
          ✕
        </button>

        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${accentTone === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
          <span className={`h-2.5 w-2.5 rounded-full ${accentTone === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}`} />
          Live alert
        </div>

        <p className="mt-4 text-base font-semibold leading-7 text-slate-900">{message}</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">{supportingCopy}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onResolve?.('secure')}
            disabled={Boolean(resolvingStatus)}
            className="rounded-xl border border-emerald-200 bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(16,185,129,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {resolvingStatus === 'secure' ? 'Updating...' : "It\'s Me"}
          </button>
          <button
            type="button"
            onClick={() => onResolve?.('threat')}
            disabled={Boolean(resolvingStatus)}
            className="rounded-xl border border-rose-200 bg-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(244,63,94,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {resolvingStatus === 'threat' ? 'Updating...' : 'Confirm Threat'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;