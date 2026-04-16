import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import AlertsTable from '../components/AlertsTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import { useAuth } from '../contexts/AuthContext';
import { request, socketBase } from '../lib/api';
import { isAlertEvent, isFireEvent, isIntrusionEvent } from '../lib/security';

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

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ email: '' });
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingEventId, setDeletingEventId] = useState('');
  const [clearingEvents, setClearingEvents] = useState(false);

  const loadAdminData = async () => {
    setLoading(true);
    setError('');

    try {
      const [usersResponse, eventsResponse] = await Promise.all([
        request('/api/users'),
        request('/api/security/events?limit=200'),
      ]);

      setUsers(usersResponse.users || []);
      setEvents(Array.isArray(eventsResponse.events) ? eventsResponse.events : []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    const socket = io(socketBase, {
      auth: { token: localStorage.getItem('security-token') },
    });

    socket.on('security:event', (event) => {
      setEvents((current) => mergeEventsById(current, [event]));
    });

    socket.on('security:event-deleted', ({ id }) => {
      setEvents((current) => current.filter((item) => item.id !== id));
    });

    socket.on('security:events-cleared', () => {
      setEvents((current) => current.filter((event) => !isAlertEvent(event)));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const stats = useMemo(() => {
    const activeUsers = users.filter((item) => item.isActive).length;
    const disabledUsers = users.filter((item) => !item.isActive).length;
    const intrusionLogs = events.filter((event) => isIntrusionEvent(event)).length;
    const fireLogs = events.filter((event) => isFireEvent(event)).length;
    const securityLogs = events.filter((event) => isAlertEvent(event)).length;

    return { activeUsers, disabledUsers, intrusionLogs, fireLogs, securityLogs };
  }, [users, events]);

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
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
        <p className="text-xs uppercase tracking-[0.34em] text-amber-200/70">Admin console</p>
        <h2 className="mt-3 text-4xl font-semibold text-white">Security administration dashboard</h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-white/60">
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
              <span className="text-sm text-white/60">Email address</span>
              <input
                value={form.email}
                onChange={(event) => setForm({ email: event.target.value })}
                type="email"
                required
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-amber-400/40 focus:bg-white/8"
                placeholder="new.user@example.com"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-red-500 px-4 py-3 font-semibold text-slate-950 transition hover:brightness-110"
            >
              Add user
            </button>
          </form>

          {temporaryPassword ? (
            <div className="mt-4 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              Temporary password: <span className="font-semibold">{temporaryPassword}</span>
            </div>
          ) : null}

          {error ? <div className="mt-4 rounded-3xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</div> : null}
        </SectionCard>

        <SectionCard title="Registered users" subtitle="View, disable, delete, and manage mail broadcasts">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40">
            <div className="max-h-[520px] overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-950/95 text-white/55">
                  <tr>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Broadcast</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {users.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-white/55" colSpan="5">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((account) => (
                      <tr key={account.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 text-white">{account.email}</td>
                        <td className="px-4 py-3 text-white/70">{account.role}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.22em] ${account.isActive ? 'bg-emerald-500/15 text-emerald-100' : 'bg-slate-500/15 text-slate-100'}`}>
                            {account.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleToggleBroadcast(account.id, account.broadcastEnabled)}
                            className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.22em] transition ${account.broadcastEnabled ? 'bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25' : 'bg-slate-500/15 text-slate-100 hover:bg-slate-500/25'}`}
                          >
                            {account.broadcastEnabled ? 'Enabled' : 'Muted'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleDisable(account.id)}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/70 transition hover:bg-white/10 hover:text-white"
                            >
                              Disable
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(account.id)}
                              className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-red-100 transition hover:bg-red-500/20"
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
              className="rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {clearingEvents ? 'Deleting all...' : 'Delete all alerts'}
            </button>
          }
        >
          <AlertsTable alerts={securityEvents} onDeleteAlert={handleDeleteEvent} deletingAlertId={deletingEventId} />
        </SectionCard>

        <SectionCard title="Mail broadcast settings" subtitle="Operational alert delivery">
          <div className="space-y-4 text-sm leading-7 text-white/65">
            <p>
              Active users with broadcast enabled receive intrusion and fire alerts, and the seeded admin mailbox is always included.
            </p>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-white/55">Total active recipients</p>
              <p className="mt-2 text-3xl font-semibold text-white">{stats.activeUsers + 1}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-white/55">Broadcast policy</p>
              <p className="mt-2 text-white">All intrusion and fire security events generate Gmail notifications via Nodemailer using environment variables only.</p>
            </div>
          </div>
        </SectionCard>
      </section>
    </main>
  );
};

export default AdminDashboard;