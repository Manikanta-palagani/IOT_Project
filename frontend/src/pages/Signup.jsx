import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Signup = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
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
      const response = await register(form.email, form.password);
      navigate(response.user.role === 'admin' ? '/admin' : '/app');
    } catch (registerError) {
      setError(registerError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto grid min-h-[calc(100vh-81px)] max-w-7xl place-items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[32px] border border-white/10 bg-slate-950/80 p-8 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.34em] text-white/45">Enroll user</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Create a secure account</h2>
          <p className="mt-4 text-white/60">Register a monitored user account with JWT access to the security dashboard.</p>
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-white/65">
            Admin accounts are seeded on the backend. New registrations are created as standard users.
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-slate-950/90 p-8 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.34em] text-white/45">Sign up</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">New account</h3>

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
                placeholder="homeowner@example.com"
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
                placeholder="Create a strong password"
              />
            </label>

            {error ? <p className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-red-500 to-amber-400 px-4 py-3 font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-sm text-white/55">
            Already registered? <Link to="/login" className="text-red-200 underline decoration-red-400/50 underline-offset-4">Back to login</Link>
          </p>
        </section>
      </div>
    </main>
  );
};

export default Signup;