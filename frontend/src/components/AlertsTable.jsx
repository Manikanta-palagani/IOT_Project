import { useEffect, useMemo, useState } from 'react';
import { isFireEvent, isIntrusionEvent } from '../lib/security';

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};

const AlertsTable = ({ alerts, onDeleteAlert, deletingAlertId }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const sortedAlerts = useMemo(() => {
    return [...alerts].sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp));
  }, [alerts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(sortedAlerts.length / itemsPerPage));

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, itemsPerPage, sortedAlerts.length]);

  const totalPages = Math.max(1, Math.ceil(sortedAlerts.length / itemsPerPage));
  const start = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedAlerts.slice(start, start + itemsPerPage);
  const rangeStart = sortedAlerts.length === 0 ? 0 : start + 1;
  const rangeEnd = sortedAlerts.length === 0 ? 0 : Math.min(start + itemsPerPage, sortedAlerts.length);

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            Showing <span className="font-semibold text-slate-900">{rangeStart}</span>
            {' '}
            to <span className="font-semibold text-slate-900">{rangeEnd}</span>
            {' '}
            of <span className="font-semibold text-slate-900">{sortedAlerts.length}</span> alerts
          </p>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span>Show:</span>
            <select
              value={itemsPerPage}
              onChange={(event) => setItemsPerPage(Number(event.target.value))}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-300"
            >
              {[5, 10, 20, 30].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 shadow-[0_1px_0_rgba(15,23,42,0.08)]">
            <tr>
              <th className="px-5 py-3 font-medium">Timestamp</th>
              <th className="px-5 py-3 font-medium">Device ID</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td className="px-5 py-8 text-slate-500" colSpan="4">
                  No alerts received yet.
                </td>
              </tr>
            ) : (
              paginatedData.map((alert, index) => {
                const alertId = alert.id || alert._id;
                const fireAlert = isFireEvent(alert);
                const intrusionAlert = isIntrusionEvent(alert);
                const statusLabel = fireAlert ? '🔥 FIRE ALERT' : intrusionAlert ? 'Suspicious' : 'Clear';
                const statusTone = fireAlert ? 'bg-rose-100 text-rose-700 border-rose-200' : intrusionAlert ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200';

                return (
                  <tr key={alertId} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} transition hover:bg-slate-100`}>
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

      <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-sm text-slate-600">
          Page <span className="font-semibold text-slate-900">{currentPage}</span> of <span className="font-semibold text-slate-900">{totalPages}</span>
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>

          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => setCurrentPage(pageNumber)}
              className={`min-w-10 rounded-full px-3 py-2 text-sm font-semibold transition ${pageNumber === currentPage ? 'bg-slate-900 text-white shadow-[0_10px_25px_rgba(15,23,42,0.16)]' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'}`}
            >
              {pageNumber}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertsTable;
