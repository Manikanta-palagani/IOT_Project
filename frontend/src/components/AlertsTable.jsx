import { isFireEvent, isIntrusionEvent } from '../lib/security';

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};

const AlertsTable = ({ alerts, onDeleteAlert, deletingAlertId }) => {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-5 py-3 font-medium">Timestamp</th>
              <th className="px-5 py-3 font-medium">Device ID</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {alerts.length === 0 ? (
              <tr>
                <td className="px-5 py-8 text-slate-500" colSpan="4">
                  No alerts received yet.
                </td>
              </tr>
            ) : (
              alerts.map((alert) => {
                const alertId = alert.id || alert._id;
                const fireAlert = isFireEvent(alert);
                const intrusionAlert = isIntrusionEvent(alert);
                const statusLabel = fireAlert ? '🔥 FIRE ALERT' : intrusionAlert ? 'Suspicious' : 'Clear';
                const statusTone = fireAlert ? 'bg-rose-100 text-rose-700 border-rose-200' : intrusionAlert ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200';

                return (
                  <tr key={alertId} className="hover:bg-slate-50">
                    <td className="px-5 py-4 text-slate-600">{formatTime(alert.timestamp)}</td>
                    <td className="px-5 py-4 text-slate-900">{alert.deviceId}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone}`}>
                        {statusLabel}
                      </span>
                      <p className="mt-2 text-xs text-slate-500">
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
                        className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs uppercase tracking-[0.18em] text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
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
