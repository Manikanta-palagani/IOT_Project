import { useEffect, useState } from 'react';
import { formatDateTime } from '../lib/security';

const LiveAlertCard = ({ alert, onClose }) => {
  const [confirmingSecure, setConfirmingSecure] = useState(false);

  useEffect(() => {
    setConfirmingSecure(false);
  }, [alert?.id]);

  if (!alert) {
    return null;
  }

  const getAlertCopy = () => {
    const zone = (alert.zone || '').toLowerCase();

    if (zone.includes('locker')) {
      return 'Someone is trying to open your locker.';
    }

    if (zone.includes('restricted')) {
      return 'Intruder near restricted zone.';
    }

    if (zone.includes('door')) {
      return 'A suspicious person is attempting to access your locked room.';
    }

    return 'Possible theft attempt near secured area.';
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-4 backdrop-blur-sm sm:py-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.25),transparent_55%)] opacity-90" />
      <div className="pointer-events-none absolute inset-0 border-4 border-red-500/45 animate-pulse" />
      <div className="emergency-glow relative w-full max-w-4xl rounded-[32px] border border-red-400/40 bg-[linear-gradient(180deg,rgba(10,10,15,0.98),rgba(4,8,18,0.98))] p-5 shadow-[0_0_120px_rgba(220,38,38,0.45)] sm:p-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse" />
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-3 rounded-full border border-red-400/35 bg-red-500/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-red-100">
              <span className="h-3 w-3 rounded-full bg-red-400 shadow-[0_0_18px_rgba(248,113,113,0.95)] blink-badge" />
              Security breach alert
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-red-300/80">Emergency notification</p>
              <h2 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">⚠ SECURITY BREACH ALERT</h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-red-50/90">
              {getAlertCopy()}
            </p>
            <p className="max-w-2xl text-base leading-7 text-white/70">Stay alert and verify the secured area immediately.</p>
            <p className="max-w-2xl text-sm leading-6 text-white/50">
              The suspicious event was captured by the backend in real time and propagated through Socket.IO without requiring a page refresh.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-red-200/80">Current time</p>
                <p className="mt-2 text-lg font-semibold text-white">{formatDateTime(alert.timestamp, alert.displayTimestamp)}</p>
              </div>
              <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-red-200/80">Status</p>
                <p className="mt-2 text-lg font-semibold text-white">INTRUDER ACTIVE</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Zone</p>
                <p className="mt-2 text-lg font-semibold text-white">{alert.zone}</p>
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
                <p className="mt-2 text-2xl font-semibold text-red-100">
                  {confirmingSecure ? 'Confirm the area is safe' : 'Immediate action required'}
                </p>
                <p className="mt-3 text-sm leading-7 text-white/65">
                  {confirmingSecure
                    ? 'If this alert has been verified, confirm that the area is secure so the dashboard can return to secure mode.'
                    : 'The intrusion event was captured by the backend in real time and propagated through Socket.IO without requiring a page refresh.'}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-white/50">Device state</p>
                <p className="mt-2 text-sm leading-7 text-white/65">
                  Device ID: <span className="font-semibold text-white">{alert.deviceId}</span>
                </p>
                <p className="mt-1 text-sm leading-7 text-white/65">
                  Zone: <span className="font-semibold text-white">{alert.zone}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={confirmingSecure ? onClose : () => setConfirmingSecure(true)}
              className="mt-6 w-full rounded-2xl border border-red-300/30 bg-red-500/20 px-4 py-4 text-sm font-semibold uppercase tracking-[0.28em] text-red-50 transition hover:bg-red-500/30 touch-manipulation"
            >
              {confirmingSecure ? "It's me, area secure" : 'Acknowledge Alert'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveAlertCard;