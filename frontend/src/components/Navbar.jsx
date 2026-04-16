import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10 text-red-100 shadow-[0_0_30px_rgba(239,68,68,0.15)] transition group-hover:scale-105">
            <span className="text-xl">◉</span>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.34em] text-red-200/70">Smart Home Security</p>
            <h1 className="text-lg font-semibold text-white sm:text-xl">Security Monitoring System</h1>
          </div>
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          {isAuthenticated ? (
            <>
              <NavLink
                to="/app"
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 transition ${isActive ? 'bg-white/12 text-white' : 'text-white/70 hover:bg-white/8 hover:text-white'}`
                }
              >
                Dashboard
              </NavLink>
              {user?.role === 'admin' ? (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 transition ${isActive ? 'bg-white/12 text-white' : 'text-white/70 hover:bg-white/8 hover:text-white'}`
                  }
                >
                  Admin
                </NavLink>
              ) : null}
              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/70 sm:flex">
                <span className={`h-2.5 w-2.5 rounded-full ${user?.role === 'admin' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                {user?.email}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-full px-4 py-2 text-white/70 transition hover:bg-white/8 hover:text-white">
                Login
              </Link>
              <Link to="/signup" className="rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-red-100 transition hover:bg-red-500/20">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
