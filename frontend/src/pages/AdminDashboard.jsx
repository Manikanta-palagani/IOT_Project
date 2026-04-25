import { useEffect, useMemo, useState } from 'react';
import AlertsTable from '../components/AlertsTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import { useAuth } from '../contexts/AuthContext';
import { request } from '../lib/api';
import { isAlertEvent, isFireEvent, isIntrusionEvent } from '../lib/security';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventStats, setEventStats] = useState({ intrusionLogs: 0, fireLogs: 0, securityLogs: 0 });
  const [form, setForm] = useState({ email: '' });
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingEventId, setDeletingEventId] = useState('');
  const [clearingEvents, setClearingEvents] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const syncAdminData = async (initial = false) => {
      if (initial) {
        setLoading(true);
      }

      try {
        const [usersResponse, eventsResponse] = await Promise.all([
          request('/api/users'),
          request('/api/security/events?limit=200'),
        ]);

        if (!isMounted) {
          return;
        }

        setUsers(usersResponse.users || []);
        setEvents(Array.isArray(eventsResponse.events) ? eventsResponse.events : []);
        setEventStats({
          intrusionLogs: eventsResponse.stats?.intrusionLogs ?? 0,
          fireLogs: eventsResponse.stats?.fireLogs ?? 0,
          securityLogs: eventsResponse.stats?.securityLogs ?? 0,
        });
        setError('');
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message);
        }
      } finally {
        if (isMounted && initial) {
          setLoading(false);
        }
      }
    };

    syncAdminData(true);
    const intervalId = window.setInterval(() => {
      syncAdminData(false);
    }, 15000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const stats = useMemo(() => {
    const activeUsers = users.filter((item) => item.isActive).length;
    const disabledUsers = users.filter((item) => !item.isActive).length;
    const intrusionLogs = eventStats.intrusionLogs || events.filter((event) => isIntrusionEvent(event)).length;
    const fireLogs = eventStats.fireLogs || events.filter((event) => isFireEvent(event)).length;
    const securityLogs = eventStats.securityLogs || events.filter((event) => isAlertEvent(event)).length;

    return { activeUsers, disabledUsers, intrusionLogs, fireLogs, securityLogs };
  }, [users, events, eventStats]);

  const securityEvents = useMemo(() => {
    return events.filter((event) => isAlertEvent(event));
  }, [events]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await request('/api/users/add', {
        method: 'POST',
        body: JSON.stringify({ email: form.email }),
      });

      setUsers((current) => [response.user, ...current]);
      setTemporaryPassword(response.temporaryPassword || '');
      setForm({ email: '' });
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const handleDisable = async (userId) => {
    try {
      const response = await request(`/api/users/${userId}/disable`, { method: 'PATCH' });
      setUsers((current) => current.map((item) => (item.id === response.user.id ? response.user : item)));
    } catch (actionError) {
      setError(actionError.message);
    }
  };

  const handleDelete = async (userId) => {
    try {
      await request(`/api/users/${userId}`, { method: 'DELETE' });
      setUsers((current) => current.filter((item) => item.id !== userId));
    } catch (actionError) {
      setError(actionError.message);
    }
  };

  const handleToggleBroadcast = async (userId, currentValue) => {
    try {
      const response = await request(`/api/users/${userId}/broadcast`, {
        method: 'PATCH',
        body: JSON.stringify({ broadcastEnabled: !currentValue }),
      });

      setUsers((current) => current.map((item) => (item.id === response.user.id ? response.user : item)));
    } catch (actionError) {
      setError(actionError.message);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    setDeletingEventId(eventId);
    setError('');

    try {
      await request(`/api/security/events/${eventId}`, { method: 'DELETE' });
      setEvents((current) => current.filter((item) => item.id !== eventId));
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setDeletingEventId('');
    }
  };

  const handleDeleteAllEvents = async () => {
    setClearingEvents(true);
    setError('');

    try {
      await request('/api/security/events', { method: 'DELETE' });
      setEvents((current) => current.filter((event) => !event.intrusion));
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setClearingEvents(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
        <p className="text-xs uppercase tracking-[0.34em] text-blue-600">Admin console</p>
        <h2 className="mt-3 text-4xl font-semibold text-slate-900">Security administration dashboard</h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          Manage registered users, toggle broadcast settings, review suspicious security events, and maintain operational oversight as {user?.email}.
        </p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Registered Users" value={loading ? '...' : users.length} detail="All accounts in the security system." tone="cyan" emphasis="Directory" />
        <StatCard label="Active Users" value={loading ? '...' : stats.activeUsers} detail="Users currently enabled for access and email alerts." tone="emerald" emphasis="Enabled" />
        <StatCard label="Security Logs" value={loading ? '...' : stats.securityLogs} detail="Stored security events available for review." tone="red" emphasis="Events" />
        <StatCard label="Fire Alerts" value={loading ? '...' : stats.fireLogs} detail="Critical fire events available for review." tone="amber" emphasis="Critical" />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <SectionCard title="Add user" subtitle="Direct email provisioning">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm text-slate-600">Email address</span>
              <input
                value={form.email}
                onChange={(event) => setForm({ email: event.target.value })}
                type="email"
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-slate-50"
                placeholder="new.user@example.com"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-500 px-4 py-3 font-semibold text-white shadow-[0_14px_30px_rgba(59,130,246,0.18)] transition hover:brightness-105"
            >
              Add user
            </button>
          </form>

          {temporaryPassword ? (
            <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              Temporary password: <span className="font-semibold">{temporaryPassword}</span>
            </div>
          ) : null}

          {error ? <div className="mt-4 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
        </SectionCard>

        <SectionCard title="Registered users" subtitle="View, disable, delete, and manage mail broadcasts">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="max-h-[520px] overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Broadcast</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-slate-500" colSpan="5">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((account) => (
                      <tr key={account.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-900">{account.email}</td>
                        <td className="px-4 py-3 text-slate-600">{account.role}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.22em] ${account.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                            {account.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleToggleBroadcast(account.id, account.broadcastEnabled)}
                            className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.22em] transition ${account.broadcastEnabled ? 'bg-sky-100 text-sky-700 hover:bg-sky-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                          >
                            {account.broadcastEnabled ? 'Enabled' : 'Muted'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleDisable(account.id)}
                              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                            >
                              Disable
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(account.id)}
                              className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs uppercase tracking-[0.18em] text-rose-700 transition hover:bg-rose-100"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard
          title="Security logs"
          subtitle="All alert records"
          action={
            <button
              type="button"
              onClick={handleDeleteAllEvents}
              disabled={clearingEvents || securityEvents.length === 0}
              className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs uppercase tracking-[0.22em] text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {clearingEvents ? 'Deleting all...' : 'Delete all alerts'}
            </button>
          }
        >
          <AlertsTable alerts={securityEvents} onDeleteAlert={handleDeleteEvent} deletingAlertId={deletingEventId} />
        </SectionCard>

        <SectionCard title="Mail broadcast settings" subtitle="Operational alert delivery">
          <div className="space-y-4 text-sm leading-7 text-slate-600">
            <p>
              Active users with broadcast enabled receive intrusion and fire alerts, and the seeded admin mailbox is always included.
            </p>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-slate-500">Total active recipients</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.activeUsers + 1}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-slate-500">Broadcast policy</p>
              <p className="mt-2 text-slate-700">All intrusion and fire security events generate Gmail notifications via Nodemailer using environment variables only.</p>
            </div>
          </div>
        </SectionCard>
      </section>
    </main>
  );
};

export default AdminDashboard;