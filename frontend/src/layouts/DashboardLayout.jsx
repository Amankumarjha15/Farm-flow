import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../features/auth/authSlice';
import { NAV_BY_ROLE, ADMIN_NAV_GROUPS } from './navConfig';
import NotificationBell from '../components/NotificationBell';
import useSocket from '../hooks/useSocket';

function NavItem({ item, onClick, role }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === `/${role}`}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-DEFAULT px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive ? 'bg-furrow-800 text-white' : 'text-furrow-100/70 hover:bg-furrow-900 hover:text-white'
        }`
      }
    >
      <span>{item.icon}</span>
      {item.label}
    </NavLink>
  );
}

export default function DashboardLayout() {
  useSocket();
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const nav = NAV_BY_ROLE[user?.role] || [];

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-furrow-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform overflow-y-auto bg-furrow-950 text-furrow-50 transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2 px-6">
          <span className="text-xl">🌱</span>
          <span className="font-display text-lg font-semibold">Farm Flow</span>
        </div>

        {isAdmin ? (
          <nav className="mt-2 flex flex-col gap-4 px-3 pb-4">
            {ADMIN_NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-furrow-100/30">
                  {group.label}
                </p>
                <div className="flex flex-col gap-1">
                  {group.items.map((item) => (
                    <NavItem key={item.to} item={item} role={user?.role} onClick={() => setMobileOpen(false)} />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        ) : (
          <nav className="mt-4 flex flex-col gap-1 px-3">
            {nav.map((item) => (
              <NavItem key={item.to} item={item} role={user?.role} onClick={() => setMobileOpen(false)} />
            ))}
          </nav>
        )}

        <div className="sticky bottom-0 w-full border-t border-furrow-800 bg-furrow-950 p-4">
          <button onClick={handleLogout} className="btn-ghost w-full justify-start text-furrow-100/70 hover:text-white">
            🚪 Logout
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-furrow-100 bg-white px-4 lg:px-8">
          <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            ☰
          </button>
          <div className="hidden lg:block">
            <p className="text-sm text-soil/50">
              Welcome back, <span className="font-semibold text-soil">{user?.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-wheat-400 font-display text-sm font-semibold text-soil">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
