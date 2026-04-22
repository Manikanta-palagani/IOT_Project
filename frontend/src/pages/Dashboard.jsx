import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import AnalyticsCharts from '../components/AnalyticsCharts';
import EventTimeline from '../components/EventTimeline';
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
  const [alerts, setAlerts] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showStatusBox, setShowStatusBox] = useState(true);
  const [handledAlerts, setHandledAlerts] = useState(() => {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const storedHandledAlerts = window.localStorage.getItem('handledAlerts');
      const parsedHandledAlerts = storedHandledAlerts ? JSON.parse(storedHandledAlerts) : [];
      return Array.isArray(parsedHandledAlerts) ? parsedHandledAlerts.map((id) => String(id)) : [];
    } catch (error) {
      return [];
    }
  });
  const [areaStatus, setAreaStatus] = useState('secure');
  const [resolvingAlertStatus, setResolvingAlertStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const handledAlertsRef = useRef(handledAlerts);

  useEffect(() => {
    try {
      window.localStorage.setItem('handledAlerts', JSON.stringify(handledAlerts));
    } catch (error) {
      // Ignore storage failures and keep the current session state working.
    }
  }, [handledAlerts]);

  useEffect(() => {
    handledAlertsRef.current = handledAlerts;
  }, [handledAlerts]);

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

      const id = String(alert.id || alert._id || '');
      if (!id) {
        return null;
      }

      const eventType = String(alert.eventType || alert.type || '').toLowerCase();
      const normalizedEventType = eventType === 'theft' ? 'intrusion' : eventType;

      return {
        ...alert,
        id,
        _id: id,
        eventType: normalizedEventType,
        type: normalizedEventType || alert.type || '',
        status: String(alert.status || 'pending').toLowerCase(),
      };
    };

    const sortAlerts = (nextAlerts) => [...nextAlerts].sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp));
    const isRecentAlert = (alert) => {
      const alertTime = new Date(alert?.createdAt || alert?.timestamp || alert?.updatedAt || 0).getTime();
      if (Number.isNaN(alertTime) || alertTime === 0) {
        return true;
      }

      return Date.now() - alertTime <= 20000;
    };
    const isPopupAlert = (alert) => (alert?.eventType === 'intrusion' || alert?.eventType === 'fire') && !handledAlertsRef.current.includes(alert.id) && isRecentAlert(alert);

    const syncPendingAlerts = async () => {
      try {
        const response = await request('/api/alerts?status=pending');

        const nextAlerts = Array.isArray(response.alerts)
          ? sortAlerts(response.alerts.map(normalizeAlert).filter(Boolean))
          : [];

        setAlerts(nextAlerts);

        const latestUnhandledAlert = nextAlerts.find(isPopupAlert) || null;

        if (!latestUnhandledAlert) {
          setShowPopup(false);
          if (!nextAlerts.some((alert) => alert.eventType === 'intrusion' || alert.eventType === 'fire')) {
            setAreaStatus('secure');
          }
          return;
        }

        setActiveAlert(latestUnhandledAlert);
        setShowPopup(true);
        setAreaStatus('alert');
        setShowStatusBox(true);
      } catch (requestError) {
        setError(requestError.message);
      }
    };

    syncPendingAlerts();
    const intervalId = window.setInterval(() => {
      syncPendingAlerts();
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

        setAlerts((current) => {
          const nextAlerts = current.filter((alert) => alert.id !== normalizedAlert.id);
          return sortAlerts([normalizedAlert, ...nextAlerts]);
        });

        if ((normalizedAlert.eventType === 'intrusion' || normalizedAlert.eventType === 'fire') && !handledAlertsRef.current.includes(normalizedAlert.id)) {
          setActiveAlert(normalizedAlert);
          setShowPopup(true);
          setAreaStatus('alert');
          setShowStatusBox(true);
        }
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
      latestStatus: state.fireActive ? '🔥 Fire detected near secured area' : state.intrusionActive ? '⚠ Intrusion detected near secured area' : '🟢 Area Secure',
    };
  }, [events, devices]);

  const hourlyData = useMemo(() => bucketByHour(events), [events]);
  const dailyData = useMemo(() => bucketByDay(events), [events]);
  const latestFiveEvents = useMemo(() => {
    return [...events]
      .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))
      .slice(0, 5);
  }, [events]);
  const latestAlert = activeAlert || alerts[0] || (summary.latestAlert && (isIntrusionEvent(summary.latestAlert) || isFireEvent(summary.latestAlert)) ? summary.latestAlert : null) || null;
  const latestAlertType = String(latestAlert?.eventType || latestAlert?.type || '').toLowerCase();
  const activeAlertType = String(activeAlert?.eventType || activeAlert?.type || '').toLowerCase();
  const latestAlertZone = latestAlert?.zone || summary.zone;
  const latestAlertTime = latestAlert?.timestamp || summary.latestAlertTimestamp || summary.latestTimestamp;
  const latestAlertIsCritical = areaStatus === 'alert';
  const latestAlertLabel = latestAlertIsCritical ? 'AREA NOT SECURE' : 'AREA SECURE';
  const latestAlertTone = latestAlertIsCritical
    ? 'border border-red-200 bg-red-100 text-red-700 shadow-[0_0_16px_rgba(239,68,68,0.18)]'
    : 'border border-emerald-200 bg-emerald-100 text-emerald-700';

  useEffect(() => {
    if (!alerts || alerts.length === 0) {
      setShowPopup(false);
      return;
    }

    const latestUnhandledAlert = alerts.find((alert) => (alert.eventType === 'intrusion' || alert.eventType === 'fire') && !handledAlerts.includes(alert.id) && new Date(alert.createdAt || alert.timestamp || alert.updatedAt || 0).getTime() >= Date.now() - 20000) || null;

    if (latestUnhandledAlert) {
      setActiveAlert(latestUnhandledAlert);
      setShowPopup(true);
      setAreaStatus('alert');
      setShowStatusBox(true);
      return;
    }

    setShowPopup(false);
  }, [alerts, handledAlerts]);

  const handleResolveAlert = async (status) => {
    if (!activeAlert) {
      return;
    }

    const alertId = activeAlert.id || activeAlert._id;

    setResolvingAlertStatus(status);

    try {
      await request(`/api/alerts/${alertId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });

      setHandledAlerts((current) => (current.includes(alertId) ? current : [...current, alertId]));
      setAlerts((current) => current.filter((alert) => (alert.id || alert._id) !== alertId));
      setAreaStatus(status === 'secure' ? 'secure' : 'alert');
      if (status === 'secure') {
        setActiveAlert(null);
      }
      setShowPopup(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setResolvingAlertStatus('');
    }
  };

  const handleCloseAlert = () => {
    setShowPopup(false);
  };

  const renderAlertTypeLabel = (eventType) => {
    const normalizedType = String(eventType || '').toLowerCase();

    if (normalizedType === 'fire') {
      return 'Fire';
    }

    if (normalizedType === 'intrusion') {
      return 'Intrusion';
    }

    if (normalizedType === 'motion') {
      return 'Motion';
    }

    return 'Alert';
  };

  return (
    <>
      {showPopup && activeAlert && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '320px',
            background: '#ffffff',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            zIndex: 9999,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ color: 'red' }}>
              {activeAlert.eventType === 'fire' ? '🔥 Fire Alert' : '🚨 Theft Attempt Alert'}
            </h3>

            <button type="button" onClick={handleCloseAlert}>
              ✖
            </button>
          </div>

          <p>
            <strong>Zone:</strong> {activeAlert.zone}
          </p>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              style={{ background: 'green', color: 'white', padding: '8px', borderRadius: '6px' }}
              onClick={() => {
                setAreaStatus('secure');
                setShowPopup(false);
                handleResolveAlert('secure');
              }}
            >
              It's Me
            </button>

            <button
              type="button"
              style={{ background: 'red', color: 'white', padding: '8px', borderRadius: '6px' }}
              onClick={() => {
                setAreaStatus('alert');
                setShowPopup(false);
                handleResolveAlert('threat');
              }}
            >
              Confirm Threat
            </button>
          </div>
        </div>
      )}

      <main className="relative mx-auto max-w-7xl px-4 py-6 text-slate-900 sm:px-6 lg:px-8">

      {showStatusBox && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowStatusBox(false)}
            className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-900"
            aria-label="Close live status box"
          >
            ✕
          </button>
          <SecurityStatusPanel
            areaStatus={areaStatus}
            intrusionActive={areaStatus === 'alert' && activeAlertType === 'intrusion'}
            fireActive={areaStatus === 'alert' && activeAlertType === 'fire'}
            activeZone={latestAlertZone}
            latestAlertTime={latestAlertTime}
            alertCount={summary.alertCount}
          />
        </div>
      )}

      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,transparent_96%,rgba(15,23,42,0.03)_100%)] bg-[length:100%_14px] opacity-30" />
        <div className="relative grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs uppercase tracking-[0.28em] text-slate-600">
              <span className={`h-2.5 w-2.5 rounded-full ${latestAlertIsCritical ? 'bg-rose-500 shadow-[0_0_16px_rgba(244,63,94,0.35)] blink-badge' : 'bg-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.25)]'}`} />
              {latestAlertLabel}
            </div>
            <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">Smart home security dashboard for real-time monitoring.</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              {latestAlertIsCritical
                ? `${latestAlertType === 'fire' ? '🔥 Fire' : '⚠ Theft attempt'} detected near ${latestAlertZone}. The last alert arrived ${formatRelativeTime(latestAlertTime)}.`
                : `🟢 Area secure. The latest alert is not critical, and the last signal arrived ${formatRelativeTime(latestAlertTime)}.`}
            </p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Live incident panel</p>
            <div className="mt-4 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">Current alert state</p>
                <div className={`mt-3 inline-flex rounded-full px-4 py-2 text-2xl font-semibold ${latestAlertTone}`}>{latestAlertLabel}</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Zone</p>
                  <div className="mt-2 text-lg font-semibold text-slate-900">{latestAlertZone}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Detected at</p>
                  <div className="mt-2 text-lg font-semibold text-slate-900">{formatDateTime(latestAlertTime)}</div>
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
          detail={`Latest heartbeat is ${formatRelativeTime(summary.latestTimestamp)}.`}
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
                  <h3 className="mt-2 text-2xl font-semibold text-slate-900">{latestAlertLabel}</h3>
                </div>
                <div className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.24em] ${latestAlertTone}`}>
                  {latestAlertLabel}
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Zone</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{latestAlertZone}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Event time</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{formatDateTime(latestAlertTime)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Device status</p>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
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
            Real-time security incidents, including intrusion and fire alerts, appear as a live popup in the upper-right corner as soon as the backend receives a new event.
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
          <EventTimeline events={latestFiveEvents} />
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
    </>
  );
};

export default Dashboard;
