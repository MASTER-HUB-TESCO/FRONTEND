import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { LayoutDashboard, LayoutGrid, KeyRound, Settings, Bell, LogOut, Building2, X } from 'lucide-react';
import { useAuth } from '../auth.jsx';
import { api, timeAgo } from '../api.js';

const LINKS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/portals', icon: LayoutGrid, label: 'Portals' },
  { to: '/credentials', icon: KeyRound, label: 'Credentials' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

function Bellmenu() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({ items: [], unread: 0 });
  const ref = useRef(null);
  const loc = useLocation();
  const load = () => api('/notifications').then(setState).catch(() => {});
  useEffect(() => { load(); const t = setInterval(load, 25000); return () => clearInterval(t); }, []);
  useEffect(() => { setOpen(false); }, [loc.pathname]);
  useEffect(() => { const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false); document.addEventListener('click', h); return () => document.removeEventListener('click', h); }, []);
  const markAll = async () => { setState((s) => ({ items: s.items.map((x) => ({ ...x, read: true })), unread: 0 })); await api('/notifications/read-all', { method: 'POST' }).catch(() => {}); };
  return (
    <div className="bell" ref={ref}>
      <button className="icon-btn" onClick={() => { if (!open) load(); setOpen((o) => !o); }} aria-label="Notifications">
        <Bell size={20} />{state.unread > 0 && <span className="dot">{state.unread > 9 ? '9+' : state.unread}</span>}
      </button>
      {open && (
        <div className="bell-menu">
          <div className="bell-head"><strong>Notifications</strong>{state.unread > 0 && <button className="link" onClick={markAll}>Mark all read</button>}</div>
          <div className="bell-list">
            {state.items.length === 0 && <div className="muted pad center">You're all caught up</div>}
            {state.items.slice(0, 12).map((n) => (
              <div key={n.id} className={`bell-item ${n.read ? '' : 'unread'}`}>
                <div className="bi-title">{n.title}</div>{n.message && <div className="bi-msg">{n.message}</div>}
                <div className="bi-time">{timeAgo(n.createdAt)}</div>
              </div>
            ))}
          </div>
          <NavLink to="/notifications" className="bell-all" onClick={() => setOpen(false)}>View all notifications</NavLink>
        </div>
      )}
    </div>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setMobileOpen(false), [loc.pathname]);
  return (
    <div className="shell">
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="side-brand">
          <img className="side-logo" src="/tescologo-light.png" alt="Tesco Structures" />
          <span className="side-tag">MASTER HUB</span>
          <button className="icon-btn mobile-close" onClick={() => setMobileOpen(false)}><X size={18} /></button>
        </div>
        <nav>
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="side-link"><l.icon size={18} /> {l.label}</NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <div className="who"><div className="avatar">{(user.name || 'MD')[0]}</div><div><div className="who-name">{user.name}</div><div className="who-role">{user.title || 'Managing Director'}</div></div></div>
          <button className="side-link logout" onClick={logout}><LogOut size={18} /> Sign out</button>
        </div>
      </aside>
      {mobileOpen && <div className="scrim" onClick={() => setMobileOpen(false)} />}
      <div className="main">
        <header className="topbar">
          <button className="icon-btn burger" onClick={() => setMobileOpen(true)} aria-label="Menu"><LayoutGrid size={20} /></button>
          <div className="top-brand"><img className="top-logo" src="/tescologo2.png" alt="Tesco Structures" /> Master Hub</div>
          <div className="top-right"><Bellmenu /><div className="avatar sm">{(user.name || 'MD')[0]}</div></div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
