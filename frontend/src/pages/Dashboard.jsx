import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import AnalyticsCharts from '../components/AnalyticsCharts';
import EventTimeline from '../components/EventTimeline';
import FireAlertCard from '../components/FireAlertCard';
import LiveAlertCard from '../components/LiveAlertCard';
import SecurityStatusPanel from '../components/SecurityStatusPanel';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import { useAuth } from '../contexts/AuthContext';
import { apiBase, request, socketBase } from '../lib/api';
import { bucketByDay, bucketByHour, deriveSecurityState, formatDateTime, formatRelativeTime, isAlertEvent, isFireEvent, isIntrusionEvent } from '../lib/security';

const mergeEventsById = (existingEvents, incomingEvents) => {
  const eventMap = new Map();

  [...incomingEvents, ...existingEvents].forEach((event) => {
    const key = event.id || event._id;
    if (key) {
      eventMap.set(key, event);
    }
  });

  return Array.from(eventMap.values()).sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());
};

const Dashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [devices, setDevices] = useState([]);
  const [liveAlert, setLiveAlert] = useState(null);
  const [emergencyAlert, setEmergencyAlert] = useState(null);
  const [fireAlert, setFireAlert] = useState(null);
  const [alertStep, setAlertStep] = useState('idle');
  const [manualSecureOverride, setManualSecureOverride] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const notifiedRef = useRef(false);
  const notifiedAlertIdsRef = useRef(new Set());

  useEffect(() => {
    let isMounted = true;

    const loadEvents = async () => {
      try {
        const response = await request('/api/security/events?limit=200');
        if (!isMounted) {
          return;
        }

        setEvents(Array.isArray(response.events) ? response.events : []);
        setDevices(Array.isArray(response.devices) ? response.devices : []);
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const socket = io(socketBase, {
      auth: { token: localStorage.getItem('security-token') },
    });

    socket.on('security:event', (event) => {
      setEvents((current) => mergeEventsById(current, [event]));

      if (event.device) {
        setDevices((current) => [event.device, ...current.filter((device) => device.deviceId !== event.device.deviceId)]);
      }

      if (isFireEvent(event)) {
        setFireAlert(event);
      } else if (isIntrusionEvent(event)) {
        setLiveAlert(event);
        setEmergencyAlert(event);
        setAlertStep('alert');
        setManualSecureOverride(false);
      }
    });

    socket.on('security:event-deleted', ({ id }) => {
      setEvents((current) => current.filter((item) => item.id !== id));
      setLiveAlert((current) => (current?.id === id ? null : current));
      setEmergencyAlert((current) => (current?.id === id ? null : current));
      setFireAlert((current) => (current?.id === id ? null : current));
    });

    socket.on('security:events-cleared', () => {
      setEvents((current) => current.filter((event) => !isAlertEvent(event)));
      setLiveAlert(null);
      setEmergencyAlert(null);
      setFireAlert(null);
      setAlertStep('idle');
      setManualSecureOverride(false);
    });

    socket.on('security:snapshot', (snapshot) => {
      if (snapshot?.device) {
        setDevices((current) => [snapshot.device, ...current.filter((device) => device.deviceId !== snapshot.device.deviceId)]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const alertsToNotify = [liveAlert, fireAlert].filter(Boolean);

    if (!alertsToNotify.length) {
      return undefined;
    }

    if (window.Notification && Notification.permission === 'default' && !notifiedRef.current) {
      Notification.requestPermission();
      notifiedRef.current = true;
    }

    if (window.Notification && Notification.permission === 'granted') {
      alertsToNotify.forEach((alert) => {
        if (notifiedAlertIdsRef.current.has(alert.id)) {
          return;
        }

        notifiedAlertIdsRef.current.add(alert.id);

        if (isFireEvent(alert)) {
          new Notification('🔥 FIRE EMERGENCY ALERT', {
            body: 'Critical fire detected in room.',
            icon: '/favicon.ico',
          });
          return;
        }

        new Notification('Possible theft attempt near secured area', {
          body: 'A suspicious person is attempting to access your locked room.',
          icon: '/favicon.ico',
        });
      });
    }
  }, [fireAlert, liveAlert]);

  const summary = useMemo(() => {
    const state = deriveSecurityState(events, devices);
    const intrusionCount = events.filter((event) => isIntrusionEvent(event)).length;
    const fireCount = events.filter((event) => isFireEvent(event)).length;
    const alertCount = events.filter((event) => isAlertEvent(event)).length;
    const latestEvent = state.latestEvent;
    const latestAlert = state.latestAlert || latestEvent;
    const activeZone = state.latestIntrusion?.zone || state.zone;

    return {
      ...state,
      activeZone,
      intrusionCount,
      fireCount,
      alertCount,
      latestTime: formatDateTime(latestEvent?.timestamp, latestEvent?.displayTimestamp),
      latestEventRelative: formatRelativeTime(latestEvent?.timestamp),
      latestAlertRelative: formatRelativeTime(latestAlert?.timestamp),
      deviceLabel: state.deviceOnline ? 'ONLINE' : 'OFFLINE',
      currentStateLabel: state.fireActive ? '🔥 FIRE ALERT' : state.intrusionActive ? '⚠ Intruder near restricted zone' : '🟢 Area Secure',
      latestStatus: state.fireActive ? '🔥 Fire detected near secured area' : latestEvent?.intrusion ? '⚠ Possible theft attempt near secured area' : '🟢 Area Secure',
    };
  }, [events, devices]);

  const hourlyData = useMemo(() => bucketByHour(events), [events]);
  const dailyData = useMemo(() => bucketByDay(events), [events]);
  const emergencyEventTime = formatDateTime(emergencyAlert?.timestamp, emergencyAlert?.displayTimestamp);
  const displayedIntrusionActive = summary.intrusionActive && !manualSecureOverride;
  const displayedFireActive = summary.fireActive;
  const displayedCurrentStateLabel = displayedFireActive ? '🔥 FIRE ALERT' : displayedIntrusionActive ? '⚠ Intruder near restricted zone' : '🟢 Area Secure';
  const displayedLatestStatus = displayedFireActive ? '🔥 Fire detected near secured area' : displayedIntrusionActive ? summary.latestStatus : '🟢 Area Secure';

  const handleAcknowledgeAlert = () => {
    if (emergencyAlert) {
      setAlertStep('confirm');
    }
  };

  const handleMarkAreaSecure = () => {
    setManualSecureOverride(true);
    setAlertStep('idle');
    setEmergencyAlert(null);
    setLiveAlert(null);
  };

  return (
    <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {fireAlert ? <FireAlertCard alert={fireAlert} onClose={() => setFireAlert(null)} /> : null}

      {emergencyAlert ? (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.38),transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(0,0,0,0.98))] px-4 py-4 text-white sm:py-6">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_0%,transparent_94%,rgba(255,255,255,0.06)_100%)] bg-[length:100%_14px] opacity-30" />
          <div className="pointer-events-none absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.22),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-0 border-4 border-red-500/60 shadow-[inset_0_0_0_2px_rgba(248,113,113,0.28),0_0_70px_rgba(220,38,38,0.65)] animate-pulse" />

          <div className="emergency-glow relative z-10 w-full max-w-5xl rounded-[34px] border border-red-400/50 bg-[linear-gradient(180deg,rgba(11,15,25,0.98),rgba(2,6,23,0.99))] p-5 shadow-[0_0_120px_rgba(220,38,38,0.45)] sm:p-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse" />
            <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-3 rounded-full border border-red-400/40 bg-red-500/15 px-4 py-2 text-xs uppercase tracking-[0.34em] text-red-100">
                  <span className="h-3 w-3 rounded-full bg-red-400 shadow-[0_0_18px_rgba(248,113,113,0.95)] blink-badge" />
                  Possible theft attempt near secured area
                </div>

                <div>
                  <p className="text-sm uppercase tracking-[0.4em] text-red-300/80">Real-time security event</p>
                  <h1 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">⚠ SECURITY BREACH ALERT</h1>
                </div>

                <p className="max-w-3xl text-lg leading-8 text-red-50/95 sm:text-xl">A suspicious person is attempting to access your locked room</p>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-3xl border border-red-400/35 bg-red-500/12 p-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.28em] text-red-200/75">Zone</p>
                    <p className="mt-2 text-lg font-semibold text-white">{emergencyAlert.zone || 'Main Entrance'}</p>
                  </div>
                  <div className="rounded-3xl border border-red-400/35 bg-red-500/12 p-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.28em] text-red-200/75">Event Time</p>
                    <p className="mt-2 text-lg font-semibold text-white">{emergencyEventTime}</p>
                  </div>
                  <div className="rounded-3xl border border-red-400/35 bg-red-500/12 p-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.28em] text-red-200/75">Device ID</p>
                    <p className="mt-2 text-lg font-semibold text-white">{emergencyAlert.deviceId || 'Unknown device'}</p>
                  </div>
                  <div className="rounded-3xl border border-red-400/35 bg-red-500/12 p-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.28em] text-red-200/75">Status</p>
                    <div className="mt-2 inline-flex rounded-full border border-red-300/35 bg-red-500/20 px-4 py-2 text-sm font-semibold uppercase tracking-[0.28em] text-red-50">
                      INTRUDER ACTIVE
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-red-400/35 bg-[linear-gradient(180deg,rgba(127,29,29,0.36),rgba(15,23,42,0.9))] p-4 shadow-[inset_0_0_50px_rgba(239,68,68,0.14)] sm:p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-300/40 bg-red-500/20 text-3xl shadow-[0_0_30px_rgba(248,113,113,0.45)]">⚠</div>
                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-[0.32em] text-red-200/70">Warning</p>
                      <p className="text-lg leading-8 text-red-50/95">A suspicious person is attempting to access your locked room. Stay alert and verify the secured area immediately.</p>
                    </div>
                  </div>
                </div>

                {alertStep === 'confirm' ? (
                  <div className="rounded-[28px] border border-emerald-400/30 bg-emerald-500/10 p-4 shadow-[inset_0_0_50px_rgba(16,185,129,0.1)] sm:p-5">
                    <p className="text-xs uppercase tracking-[0.32em] text-emerald-100/70">Confirmation</p>
                    <p className="mt-2 text-lg leading-8 text-emerald-50">If this was you, confirm the area is safe to return the dashboard to secure mode.</p>
                    <button
                      type="button"
                      onClick={handleMarkAreaSecure}
                      className="mt-4 w-full rounded-2xl border border-emerald-300/30 bg-emerald-500/20 px-4 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-50 transition hover:bg-emerald-500/30 hover:shadow-[0_0_35px_rgba(16,185,129,0.25)]"
                    >
                      It&apos;s me, area secure
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="flex w-full max-w-xl flex-col justify-between rounded-[30px] border border-red-400/30 bg-black/35 p-4 backdrop-blur-xl lg:w-[420px] sm:p-5">
                <div className="space-y-4">
                  <div className="rounded-3xl border border-red-400/25 bg-red-500/10 p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-red-200/75">Immediate action</p>
                    <p className="mt-2 text-2xl font-semibold text-red-100">Live emergency overlay</p>
                    <p className="mt-3 text-sm leading-7 text-white/70">
                      {alertStep === 'confirm'
                        ? 'If this is your presence or a false alarm, confirm the area is secure.'
                        : 'This alert was triggered directly from the socket event stream and will remain visible until acknowledged.'}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/50">Event details</p>
                    <div className="mt-3 space-y-3 text-sm leading-7 text-white/70">
                      <p>
                        Zone: <span className="font-semibold text-white">{emergencyAlert.zone || 'Main Entrance'}</span>
                      </p>
                      <p>
                        Event Time: <span className="font-semibold text-white">{emergencyEventTime}</span>
                      </p>
                      <p>
                        Device ID: <span className="font-semibold text-white">{emergencyAlert.deviceId || 'Unknown device'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAcknowledgeAlert}
                  className="mt-6 w-full rounded-2xl border border-red-300/35 bg-red-500/20 px-4 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-red-50 transition hover:bg-red-500/30 hover:shadow-[0_0_35px_rgba(248,113,113,0.35)]"
                >
                  Acknowledge Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <SecurityStatusPanel
        intrusionActive={displayedIntrusionActive}
        fireActive={displayedFireActive}
        activeZone={summary.activeZone}
        latestAlertTime={summary.latestAlertTimestamp || summary.latestTimestamp}
        alertCount={summary.alertCount}
        deviceId={summary.deviceId}
      />

      <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.18),transparent_38%),radial-gradient(circle_at_top_right,rgba(250,204,21,0.12),transparent_28%),linear-gradient(180deg,rgba(3,7,18,0.96),rgba(2,6,23,0.92))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)] sm:p-8">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,transparent_96%,rgba(255,255,255,0.03)_100%)] bg-[length:100%_14px] opacity-30" />
        <div className="relative grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-red-100">
              <span className={`h-2.5 w-2.5 rounded-full ${displayedFireActive ? 'bg-orange-400 shadow-[0_0_16px_rgba(251,146,60,0.9)] blink-badge' : displayedIntrusionActive ? 'bg-red-400 shadow-[0_0_16px_rgba(248,113,113,0.85)] blink-badge' : 'bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.65)]'}`} />
              {displayedFireActive ? 'FIRE ACTIVE' : displayedIntrusionActive ? 'THREAT ACTIVE' : 'AREA SECURE'}
            </div>
            <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">Smart home security dashboard for real-time monitoring.</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/60">
              {displayedFireActive
                ? `🔥 Critical fire detected in room at ${summary.zone}. The last signal came ${summary.latestAlertRelative}.`
                : displayedIntrusionActive
                ? `⚠ A suspicious person is attempting to access your locked room at ${summary.zone}. The last signal came ${summary.latestEventRelative}.`
                : `🟢 Area Secure. The system is tracking ${summary.deviceId} and the latest signal arrived ${summary.latestEventRelative}.`}
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.28em] text-white/45">Live incident panel</p>
            <div className="mt-4 space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/55">Current alert state</p>
                <div className={`mt-3 text-2xl font-semibold ${displayedFireActive ? 'text-orange-100' : displayedIntrusionActive ? 'text-red-100' : 'text-emerald-100'}`}>{displayedCurrentStateLabel}</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/45">Zone</p>
                  <div className="mt-2 text-lg font-semibold text-white">{summary.zone}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/45">Detected at</p>
                  <div className="mt-2 text-lg font-semibold text-white">{summary.latestTime}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Device Status"
          value={loading ? '...' : summary.deviceLabel}
          detail={`Latest heartbeat for ${summary.deviceId} is ${formatRelativeTime(summary.latestTimestamp)}.`}
          tone={summary.deviceOnline ? 'emerald' : 'slate'}
          emphasis="Heartbeat"
        />
        <StatCard
          label="Intrusion Alerts"
          value={loading ? '...' : summary.intrusionCount}
          detail="Count of intrusion events stored in MongoDB Atlas."
          tone="red"
          emphasis="Archive"
        />
        <StatCard
          label="Fire Alerts"
          value={loading ? '...' : summary.fireCount}
          detail="Count of fire events stored in MongoDB Atlas."
          tone="amber"
          emphasis="Critical"
        />
        <StatCard
          label="Latest Event Time"
          value={loading ? '...' : summary.latestTime}
          detail={error || 'Socket.io keeps the dashboard synchronized with the backend.'}
          tone="amber"
          emphasis="Timestamp"
        />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Security status" subtitle="Hero security card">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/45">System state</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">{displayedLatestStatus}</h3>
                </div>
                <div className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.24em] ${displayedIntrusionActive ? 'blink-badge border border-red-400/25 bg-red-500/15 text-red-100' : 'border border-emerald-400/25 bg-emerald-500/15 text-emerald-100'}`}>
                  {displayedIntrusionActive ? 'THREAT ACTIVE' : 'AREA SECURE'}
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">Zone</p>
                  <p className="mt-2 text-lg font-semibold text-white">{summary.zone}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">Event time</p>
                  <p className="mt-2 text-lg font-semibold text-white">{summary.latestTime}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-white/45">Device status</p>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-white/55">Device</span>
                  <span className="font-semibold text-white">{summary.deviceId}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-white/55">Status</span>
                  <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.22em] ${summary.deviceOnline ? 'bg-emerald-500/15 text-emerald-100' : 'bg-slate-500/15 text-slate-100'}`}>
                    {summary.deviceOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-white/55">Last seen</span>
                  <span className="font-medium text-white">{formatRelativeTime(summary.latestTimestamp)}</span>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/55">
                {user?.role === 'admin' ? 'Admin access is enabled for alert management and user administration.' : 'User access is restricted to live monitoring and event history.'}
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Live security event" subtitle="Popup notification card">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-white/60">
            Real-time security incidents, including fire and intrusion events, will surface as a live popup in the upper-right corner as soon as the ESP32 posts a new event.
          </div>
        </SectionCard>
      </section>

      <section className="mt-6">
        <SectionCard title="Alert analytics" subtitle="Hourly and daily analytics charts">
          <AnalyticsCharts
            hourlyData={hourlyData.map((item) => ({ label: `${item.hour}:00`, count: item.count }))}
            dailyData={dailyData.map((item) => ({ label: item.label, count: item.count }))}
          />
        </SectionCard>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Event history timeline" subtitle="Security event history cards">
          <EventTimeline events={events.slice(0, 8)} />
        </SectionCard>

        <SectionCard title="Device heartbeat" subtitle="Online/offline state">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-white/45">Latest heartbeat</p>
              <p className="mt-3 text-2xl font-semibold text-white">{formatRelativeTime(summary.latestTimestamp)}</p>
              <p className="mt-2 text-sm text-white/55">Heartbeat is inferred from the most recent ESP32 POST received by the backend.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-white/45">Live endpoint</p>
              <p className="mt-3 break-all text-sm text-white/70">{apiBase}/api/security/alert</p>
              <p className="mt-2 text-sm text-white/55">The ESP32 can continue posting the same JSON payload to this secure endpoint.</p>
            </div>
          </div>
        </SectionCard>
      </section>

      <LiveAlertCard alert={liveAlert} onClose={() => setLiveAlert(null)} />
    </main>
  );
};

export default Dashboard;
