import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(form.email, form.password);
      navigate(response.user.role === 'admin' ? '/admin' : '/app');
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto grid min-h-[calc(100vh-81px)] max-w-7xl place-items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[32px] border border-white/10 bg-slate-950/80 p-8 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.34em] text-red-200/70">Secure access</p>
          <h2 className="mt-3 max-w-xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Smart home security for authenticated operators.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/60">
            Monitor live intrusion events, device heartbeat status, and admin controls from a single security console.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {['Intrusion analytics', 'Role-based access', 'Mail alerts'].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-slate-950/90 p-8 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.34em] text-white/45">Login</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">Access your dashboard</h3>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm text-white/60">Email</span>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-red-400/40 focus:bg-white/8"
                placeholder="security.operator@home.com"
              />
            </label>
            <label className="block">
              <span className="text-sm text-white/60">Password</span>
              <input
                name="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-red-400/40 focus:bg-white/8"
                placeholder="Enter your password"
              />
            </label>

            {error ? <p className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-red-500 to-amber-400 px-4 py-3 font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-sm text-white/55">
            New user? <Link to="/signup" className="text-red-200 underline decoration-red-400/50 underline-offset-4">Create an account</Link>
          </p>
        </section>
      </div>
    </main>
  );
};

export default Login;