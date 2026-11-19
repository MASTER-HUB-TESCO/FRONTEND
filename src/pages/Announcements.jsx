import { useEffect, useState } from 'react';
import { Megaphone, Plus, Trash2, Pin, X } from 'lucide-react';
import { api, timeAgo } from '../api.js';

export default function Announcements() {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', pinned: false });
  const [busy, setBusy] = useState(false);
  const load = () => api('/announcements').then((d) => setItems(d.announcements)).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await api('/announcements', { method: 'POST', body: form }); setForm({ title: '', body: '', pinned: false }); setOpen(false); load(); }
    catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };
  const del = async (id) => { if (!window.confirm('Delete this announcement?')) return; try { await api(`/announcements/${id}`, { method: 'DELETE' }); load(); } catch (e) { setErr(e.message); } };

  return (
    <div>
      <div className="page-head"><div><h1>Announcements</h1><p className="muted">Company-wide updates for the management team.</p></div>
        <button className="btn primary" onClick={() => setOpen(true)}><Plus size={16} /> New</button></div>
      {err && <div className="alert error">{err}</div>}
      {!items ? <div className="loader"><div className="spinner" /></div> : items.length === 0 ? <div className="empty-soft"><Megaphone size={30} /><div>No announcements yet.</div></div> : (
        <div className="ann-list">
          {items.map((a) => (
            <div className="ann" key={a.id}>
              {a.pinned && <span className="ann-pin"><Pin size={13} /></span>}
              <div className="ann-main"><div className="ann-title">{a.title}</div>{a.body && <div className="ann-body">{a.body}</div>}<div className="ann-meta">{a.author || 'Management'} · {timeAgo(a.createdAt)}</div></div>
              <button className="icon-btn danger" onClick={() => del(a.id)} title="Delete"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <form className="modal" onSubmit={add}>
            <div className="modal-head"><h3>New announcement</h3><button type="button" className="icon-btn" onClick={() => setOpen(false)}><X size={18} /></button></div>
            <div className="modal-body">
              {err && <div className="alert error">{err}</div>}
              <label className="field"><span>Title</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
              <label className="field"><span>Details</span><textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></label>
              <label className="check"><input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} /> Pin to top</label>
            </div>
            <div className="modal-foot"><button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Posting…' : 'Post'}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
