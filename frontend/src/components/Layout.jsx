import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotifyContext';
import { useLang } from '../i18n';
import { LangToggle, ThemeToggle } from './Toggles';

const STUDENT_NAV = [
  ['/dashboard', '🏠', 'Dashboard'],
  ['/scholarships', '🔎', 'Find Scholarships'],
  ['/bookmarks', '🔖', 'My Bookmarks'],
  ['/applications', '📄', 'My Applications'],
  ['/profile', '👤', 'Profile'],
  ['/notifications', '🔔', 'Notifications'],
  ['/account', '🔐', 'Account'],
];
const ADMIN_NAV = [
  ['/admin', '📊', 'Dashboard'],
  ['/admin/scholarships', '🎓', 'Scholarships'],
  ['/admin/applications', '📄', 'Applications'],
  ['/admin/students', '👥', 'Students'],
  ['/notifications', '🔔', 'Notifications'],
  ['/account', '🔐', 'Account'],
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { items, unread, markAllRead } = useNotify();
  const { t } = useLang();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const [bell, setBell] = useState(false);
  const [q, setQ] = useState('');
  const nav = user.role === 'admin' ? ADMIN_NAV : STUDENT_NAV;

  const search = (e) => {
    e.preventDefault();
    navigate(`/scholarships?q=${encodeURIComponent(q.trim())}`);
    setMenu(false);
  };

  return (
    <div className="shell">
      <aside className={`sidebar ${menu ? 'open' : ''}`}>
        <div className="brand">
          <span className="brand-logo">🎓</span>
          <div><div className="brand-name">Scholar<b>Match</b></div><div className="brand-tag">{t('Find · Apply · Achieve')}</div></div>
        </div>
        <nav onClick={() => setMenu(false)}>
          {nav.map(([to, icon, label]) => (
            <NavLink key={to} to={to} end={to === '/admin' || to === '/dashboard'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span>{icon}</span>{t(label)}
              {label === 'Notifications' && unread > 0 && <em className="nav-badge">{unread}</em>}
            </NavLink>
          ))}
          <button className="nav-item nav-logout" onClick={logout}><span>🚪</span>{t('Logout')}</button>
        </nav>
        <div className="sidebar-quote">“Dream Big…<br />Get the Support<br />You Deserve!”</div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setMenu(!menu)} aria-label="Menu">☰</button>
          {user.role === 'student' ? (
            <form className="searchbar" onSubmit={search}>
              <span>🔍</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Search scholarships (e.g. AICTE, state, course…)')} aria-label="Search scholarships" />
            </form>
          ) : <div className="searchbar-spacer" />}

          <LangToggle />
          <ThemeToggle />

          <div className="bell-wrap">
            <button className="icon-btn bell" onClick={() => { setBell(!bell); if (!bell) markAllRead(); }} aria-label="Notifications">
              🔔{unread > 0 && <em className="bell-badge">{unread}</em>}
            </button>
            {bell && (
              <div className="bell-menu">
                <div className="bell-head">{t('Notifications')}</div>
                {items.length === 0 && <div className="bell-empty">{t('Nothing new yet. We will alert you in real time.')}</div>}
                {items.slice(0, 6).map((n) => (
                  <div key={n._id} className="bell-item" onClick={() => { setBell(false); if (n.link) navigate(n.link); }}>{n.message}</div>
                ))}
                <button className="bell-all" onClick={() => { setBell(false); navigate('/notifications'); }}>{t('View all')}</button>
              </div>
            )}
          </div>

          <div className="user-chip">
            <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
            <div><div className="user-name">{user.name}</div><div className="user-role">{user.role === 'admin' ? t('Admin') : t('Student')}</div></div>
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
