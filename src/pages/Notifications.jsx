import { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { api, timeAgo } from '../api.js';

export default function Notifications() {
  const [state, setState] = useState({ items: [], unread: 0 });
  const [loading, setLoading] = useState(true);
  const load = () => api('/notifications').then(setState).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  const markAll = async () => { setState((s) => ({ items: s.items.map((x) => ({ ...x, read: true })), unread: 0 })); await api('/notifications/read-all', { method: 'POST' }).catch(() => {}); };

  return (
    <div>
      <div className="page-head"><div><h1>Notifications</h1><p className="muted">{state.unread} unread</p></div>
        {state.unread > 0 && <button className="btn ghost" onClick={markAll}><CheckCheck size={16} /> Mark all read</button>}</div>
      {loading ? <div className="loader"><div className="spinner" /></div> : state.items.length === 0 ? <div className="empty-soft"><Bell size={30} /><div>No notifications yet.</div></div> : (
        <div className="notif-list">
          {state.items.map((n) => (
            <div key={n.id} className={`notif ${n.read ? '' : 'unread'}`}>
              <span className="notif-dot" />
              <div className="notif-main"><div className="notif-title">{n.title}</div>{n.message && <div className="notif-msg">{n.message}</div>}</div>
              <div className="notif-time">{timeAgo(n.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
