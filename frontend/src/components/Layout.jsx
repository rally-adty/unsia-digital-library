import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MENU = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/books', label: 'Data Buku', icon: '📚' },
  { to: '/members', label: 'Data Anggota', icon: '👥' },
  { to: '/loans', label: 'Peminjaman', icon: '🔄' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={`app-shell${sidebarOpen ? ' sidebar-open' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">UL</span>
          <div>
            <strong>UNSIA Library</strong>
            <small>Digital Dashboard</small>
          </div>
        </div>

        <nav className="menu">
          {MENU.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `menu-item${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="avatar">{(user?.name || '?').charAt(0).toUpperCase()}</span>
            <div>
              <strong>{user?.name}</strong>
              <small>{user?.role}</small>
            </div>
          </div>
          <button type="button" className="btn btn-outline btn-block" onClick={handleLogout}>
            Keluar
          </button>
        </div>
      </aside>

      {/* Lapisan gelap saat sidebar terbuka di layar kecil */}
      <div className="sidebar-scrim" onClick={() => setSidebarOpen(false)} />

      <div className="content-area">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn menu-toggle"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Buka menu"
          >
            ☰
          </button>
          <div>
            <h1>Secure UNSIA Digital Library</h1>
            <p>Sistem pengelolaan koleksi, anggota, dan peminjaman</p>
          </div>
          <span className="badge badge-muted hide-sm">{user?.email}</span>
        </header>

        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
