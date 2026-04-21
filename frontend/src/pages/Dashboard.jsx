import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import AnalyticsCharts from '../components/AnalyticsCharts';
import AlertModal from '../components/AlertModal';
import EventTimeline from '../components/EventTimeline';
import FireAlertCard from '../components/FireAlertCard';
import SecurityStatusPanel from '../components/SecurityStatusPanel';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import { useAuth } from '../contexts/AuthContext';
import { apiBase, request, socketUrl } from '../lib/api';
import { bucketByDay, bucketByHour, deriveSecurityState, formatDateTime, formatRelativeTime, isAlertEvent, isFireEvent, isIntrusionEvent } from '../lib/security';

const Dashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [devices, setDevices] = useState([]);
  const [pendingAlerts, setPendingAlerts] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [alertResolution, setAlertResolution] = useState('secure');
  const [resolvingAlertStatus, setResolvingAlertStatus] = useState('');
  const [fireAlert, setFireAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const syncDashboardData = async (initial = false) => {
      try {
        const response = await request('/api/security/events?limit=200');
        if (!isMounted) {
          return;
        }

        setEvents(Array.isArray(response.events) ? response.events : []);
        setDevices(Array.isArray(response.devices) ? response.devices : []);
        setError('');
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.message);
        }
      } finally {
        if (isMounted && initial) {
          setLoading(false);
        }
      }
    };

    syncDashboardData(true);
    const intervalId = window.setInterval(() => {
      syncDashboardData(false);
    }, 15000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const normalizeAlert = (alert) => {
      if (!alert) {
        return null;
      }

      const id = alert.id || alert._id;
      return id ? { ...alert, id, _id: id } : null;
    };

    const syncPendingAlerts = async (initial = false) => {
      try {
        const response = await request('/api/alerts?status=pending');

        if (!isMounted) {
          return;
        }

        const nextAlerts = Array.isArray(response.alerts) ? response.alerts.map(normalizeAlert).filter(Boolean) : [];
        setPendingAlerts(nextAlerts);
        setActiveAlert((current) => {
          const currentId = current?.id || current?._id;

          if (currentId) {
            const matchedAlert = nextAlerts.find((alert) => alert.id === currentId || alert._id === currentId);
            if (matchedAlert) {
              return matchedAlert;
            }
          }

          return nextAlerts[0] || null;
        });

        if (!nextAlerts.length) {
          setAlertResolution((current) => (current === 'threat' ? current : 'secure'));
        } else {
          setAlertResolution('pending');
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.message);
        }
      }
    };

    syncPendingAlerts(true);
    const intervalId = window.setInterval(() => {
      syncPendingAlerts(false);
    }, 15000);

    if (socketUrl) {
      const socket = io(socketUrl, {
        transports: ['websocket'],
        withCredentials: true,
      });

      socketRef.current = socket;

      socket.on('new-alert', (incomingAlert) => {
        if (!isMounted || !incomingAlert) {
          return;
        }

        const normalizedAlert = normalizeAlert(incomingAlert);
        if (!normalizedAlert) {
          return;
        }

        if (normalizedAlert.status && normalizedAlert.status !== 'pending') {
          return;
        }

        setPendingAlerts((current) => {
          const nextAlerts = current.filter((alert) => alert.id !== normalizedAlert.id);
          return [normalizedAlert, ...nextAlerts];
        });
        setActiveAlert(normalizedAlert);
        setAlertResolution('pending');
      });
    }

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);

      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

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

  const currentPendingAlert = activeAlert || pendingAlerts[0] || null;
  const hourlyData = useMemo(() => bucketByHour(events), [events]);
  const dailyData = useMemo(() => bucketByDay(events), [events]);
  const displayedFireActive = summary.fireActive;
  const displayedIntrusionActive = Boolean(currentPendingAlert) || alertResolution === 'threat';
  const displayedCurrentStateLabel = displayedFireActive
    ? '🔥 FIRE ALERT'
    : displayedIntrusionActive
      ? alertResolution === 'threat'
        ? '⚠ Threat confirmed'
        : '⚠ Pending alert'
      : '🟢 Area Secure';
  const displayedLatestStatus = displayedFireActive
    ? '🔥 Fire detected near secured area'
    : displayedIntrusionActive
      ? currentPendingAlert
        ? `⚠ ${currentPendingAlert.zone || 'Main Entrance'} requires confirmation`
        : '⚠ Threat confirmed for the last alert'
      : '🟢 Area Secure';

  const handleResolveAlert = async (status) => {
    if (!currentPendingAlert) {
      return;
    }

    const alertId = currentPendingAlert.id || currentPendingAlert._id;
    const nextAlerts = pendingAlerts.filter((alert) => (alert.id || alert._id) !== alertId);

    setResolvingAlertStatus(status);

    try {
      await request(`/api/alerts/${alertId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });

      setPendingAlerts(nextAlerts);
      setActiveAlert(nextAlerts[0] || null);
      setAlertResolution(status);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setResolvingAlertStatus('');
    }
  };

  return (
    <main className="relative mx-auto max-w-7xl px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      {fireAlert ? <FireAlertCard alert={fireAlert} onClose={() => setFireAlert(null)} /> : null}
      {currentPendingAlert ? (
        <AlertModal
          alert={currentPendingAlert}
          onResolve={handleResolveAlert}
          resolvingStatus={resolvingAlertStatus}
        />
      ) : null}

      <SecurityStatusPanel
        intrusionActive={displayedIntrusionActive}
        fireActive={displayedFireActive}
        activeZone={summary.activeZone}
        latestAlertTime={summary.latestAlertTimestamp || summary.latestTimestamp}
        alertCount={summary.alertCount}
        deviceId={summary.deviceId}
      />

      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,transparent_96%,rgba(15,23,42,0.03)_100%)] bg-[length:100%_14px] opacity-30" />
        <div className="relative grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs uppercase tracking-[0.28em] text-slate-600">
              <span className={`h-2.5 w-2.5 rounded-full ${displayedFireActive ? 'bg-rose-500 shadow-[0_0_16px_rgba(244,63,94,0.35)] blink-badge' : displayedIntrusionActive ? 'bg-amber-500 shadow-[0_0_16px_rgba(245,158,11,0.3)] blink-badge' : 'bg-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.25)]'}`} />
              {displayedFireActive ? 'FIRE ACTIVE' : displayedIntrusionActive ? 'THREAT ACTIVE' : 'AREA SECURE'}
            </div>
            <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">Smart home security dashboard for real-time monitoring.</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              {displayedFireActive
                ? `🔥 Critical fire detected in room at ${summary.zone}. The last signal came ${summary.latestAlertRelative}.`
                : displayedIntrusionActive
                ? `⚠ A suspicious person is attempting to access your locked room at ${summary.zone}. The last signal came ${summary.latestEventRelative}.`
                : `🟢 Area Secure. The system is tracking ${summary.deviceId} and the latest signal arrived ${summary.latestEventRelative}.`}
            </p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Live incident panel</p>
            <div className="mt-4 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">Current alert state</p>
                <div className={`mt-3 text-2xl font-semibold ${displayedFireActive ? 'text-rose-700' : displayedIntrusionActive ? 'text-amber-700' : 'text-emerald-700'}`}>{displayedCurrentStateLabel}</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Zone</p>
                  <div className="mt-2 text-lg font-semibold text-slate-900">{summary.zone}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Detected at</p>
                  <div className="mt-2 text-lg font-semibold text-slate-900">{summary.latestTime}</div>
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
          detail={error || 'Automatic refresh keeps the dashboard synchronized with the backend.'}
          tone="amber"
          emphasis="Timestamp"
        />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Security status" subtitle="Hero security card">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">System state</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-900">{displayedLatestStatus}</h3>
                </div>
                <div className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.24em] ${displayedIntrusionActive ? 'blink-badge border border-amber-200 bg-amber-100 text-amber-700' : 'border border-emerald-200 bg-emerald-100 text-emerald-700'}`}>
                  {displayedIntrusionActive ? 'THREAT ACTIVE' : 'AREA SECURE'}
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Zone</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{summary.zone}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Event time</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{summary.latestTime}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Device status</p>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-500">Device</span>
                  <span className="font-semibold text-slate-900">{summary.deviceId}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-500">Status</span>
                  <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.22em] ${summary.deviceOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                    {summary.deviceOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-500">Last seen</span>
                  <span className="font-medium text-slate-900">{formatRelativeTime(summary.latestTimestamp)}</span>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {user?.role === 'admin' ? 'Admin access is enabled for alert management and user administration.' : 'User access is restricted to live monitoring and event history.'}
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Live security event" subtitle="Popup notification card">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
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
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Latest heartbeat</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{formatRelativeTime(summary.latestTimestamp)}</p>
              <p className="mt-2 text-sm text-slate-600">Heartbeat is inferred from the most recent ESP32 POST received by the backend.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Live endpoint</p>
              <p className="mt-3 break-all text-sm text-slate-700">{apiBase}/api/alerts</p>
              <p className="mt-2 text-sm text-slate-600">The ESP32 should POST the same JSON payload to this endpoint. Alerts now remain pending until the user resolves them.</p>
            </div>
          </div>
        </SectionCard>
      </section>
    </main>
  );
};

export default Dashboard;
