import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, CheckCircle2, XCircle, Clock, Megaphone, ExternalLink, Pin } from 'lucide-react';
import { api, timeAgo } from '../api.js';
import { useAuth } from '../auth.jsx';
import PortalCard from '../components/PortalCard.jsx';
import { portalVisual } from '../components/icons.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api('/dashboard').then(setD).catch((e) => setErr(e.message)); }, []);

  if (err) return <div className="alert error">{err}</div>;
  if (!d) return <div className="loader"><div className="spinner" /></div>;
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const openRecent = async (r) => {
    try { const res = await api(`/portals/${r.id}/access`, { method: 'POST' }); window.open(res.url || r.url, '_blank', 'noopener'); }
    catch { if (r.url) window.open(r.url, '_blank', 'noopener'); }
  };

  return (
    <div>
      <div className="page-head">
        <div><h1>{greet}, {(user.name || '').split(' ')[0]}</h1><p className="muted">One Company. All Systems. One Master Hub.</p></div>
      </div>

      <div className="stat-row">
        <div className="stat"><span className="stat-ic blue"><LayoutGrid size={20} /></span><div><div className="stat-val">{d.stats.total}</div><div className="stat-label">Total Portals</div></div></div>
        <div className="stat"><span className="stat-ic green"><CheckCircle2 size={20} /></span><div><div className="stat-val">{d.stats.active}</div><div className="stat-label">Active</div></div></div>
        <div className="stat"><span className="stat-ic red"><XCircle size={20} /></span><div><div className="stat-val">{d.stats.inactive}</div><div className="stat-label">Inactive</div></div></div>
      </div>

      {d.recent.length > 0 && (
        <section className="block">
          <div className="block-head"><h2><Clock size={18} /> Recently accessed</h2></div>
          <div className="recent-row">
            {d.recent.map((r) => { const { Icon, color } = portalVisual(r.icon); return (
              <button key={r.key} className="recent-chip" onClick={() => openRecent(r)}>
                <span className="rc-ic" style={{ background: `${color}1a`, color }}><Icon size={16} /></span>
                <span className="rc-main"><span className="rc-name">{r.name}</span><span className="rc-time">{timeAgo(r.at)}</span></span>
                <ExternalLink size={14} />
              </button>
            ); })}
          </div>
        </section>
      )}

      <section className="block">
        <div className="block-head"><h2><LayoutGrid size={18} /> Company Portals</h2><Link to="/portals" className="link">Manage</Link></div>
        <div className="portal-grid">
          {d.portals.map((p) => <PortalCard key={p.id} portal={p} />)}
        </div>
      </section>

      <section className="block">
        <div className="block-head"><h2><Megaphone size={18} /> Announcements</h2><Link to="/announcements" className="link">All</Link></div>
        {d.announcements.length === 0 ? <div className="empty-soft">No announcements yet.</div> : (
          <div className="ann-list">
            {d.announcements.map((a) => (
              <div className="ann" key={a.id}>
                {a.pinned && <span className="ann-pin"><Pin size={13} /></span>}
                <div className="ann-main"><div className="ann-title">{a.title}</div>{a.body && <div className="ann-body">{a.body}</div>}<div className="ann-meta">{a.author || 'Management'} · {timeAgo(a.createdAt)}</div></div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
