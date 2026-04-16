import { isFireEvent, isIntrusionEvent } from '../lib/security';

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};

const AlertsTable = ({ alerts, onDeleteAlert, deletingAlertId }) => {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/5 text-white/70">
            <tr>
              <th className="px-5 py-3 font-medium">Timestamp</th>
              <th className="px-5 py-3 font-medium">Device ID</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {alerts.length === 0 ? (
              <tr>
                <td className="px-5 py-8 text-white/60" colSpan="4">
                  No alerts received yet.
                </td>
              </tr>
            ) : (
              alerts.map((alert) => {
                const alertId = alert.id || alert._id;
                const fireAlert = isFireEvent(alert);
                const intrusionAlert = isIntrusionEvent(alert);
                const statusLabel = fireAlert ? '🔥 FIRE ALERT' : intrusionAlert ? 'Suspicious' : 'Clear';
                const statusTone = fireAlert ? 'bg-red-500/20 text-red-100 border-red-400/30' : intrusionAlert ? 'bg-red-500/15 text-red-200' : 'bg-emerald-500/15 text-emerald-200';

                return (
                  <tr key={alertId} className="hover:bg-white/5">
                    <td className="px-5 py-4 text-white/80">{formatTime(alert.timestamp)}</td>
                    <td className="px-5 py-4 text-white">{alert.deviceId}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone}`}>
                        {statusLabel}
                      </span>
                      <p className="mt-2 text-xs text-white/55">
                        {fireAlert
                          ? alert.statusMessage || 'Fire detected near secured area'
                          : alert.statusMessage || (intrusionAlert ? 'Possible theft attempt near secured area' : 'Clear')}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => onDeleteAlert?.(alertId)}
                        disabled={!onDeleteAlert || deletingAlertId === alertId}
                        className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingAlertId === alertId ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AlertsTable;
