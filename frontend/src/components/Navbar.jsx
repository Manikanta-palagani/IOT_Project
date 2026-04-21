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
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-white shadow-[0_12px_30px_rgba(59,130,246,0.18)] transition group-hover:scale-105">
            <span className="text-xl font-bold">◉</span>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.34em] text-slate-500">Smart Home Security</p>
            <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">Security Monitoring System</h1>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-2 text-sm">
          {isAuthenticated ? (
            <>
              <NavLink
                to="/app"
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 transition ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`
                }
              >
                Dashboard
              </NavLink>
              {user?.role === 'admin' ? (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 transition ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`
                  }
                >
                  Admin
                </NavLink>
              ) : null}
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-slate-600 sm:flex">
                <span className={`h-2.5 w-2.5 rounded-full ${user?.role === 'admin' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                {user?.email}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-full px-4 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
                Login
              </Link>
              <Link to="/signup" className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-blue-700 transition hover:bg-blue-100">
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
