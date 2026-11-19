import { useEffect, useState } from 'react';
import { ExternalLink, Pencil, X, Save } from 'lucide-react';
import { api } from '../api.js';
import { portalVisual, ICON_KEYS } from '../components/icons.jsx';

export default function Portals() {
  const [portals, setPortals] = useState(null);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = () => api('/portals').then((d) => setPortals(d.portals)).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  const save = async () => {
    setBusy(true); setErr('');
    try {
      const d = await api(`/portals/${editing.id}`, { method: 'PUT', body: { name: editing.name, url: editing.url, description: editing.description, icon: editing.icon, status: editing.status } });
      setPortals((ps) => ps.map((p) => (p.id === d.portal.id ? d.portal : p)));
      setEditing(null);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const toggle = async (p) => {
    try { const d = await api(`/portals/${p.id}`, { method: 'PUT', body: { status: p.status === 'Active' ? 'Inactive' : 'Active' } }); setPortals((ps) => ps.map((x) => (x.id === d.portal.id ? d.portal : x))); }
    catch (e) { setErr(e.message); }
  };

  if (err && !portals) return <div className="alert error">{err}</div>;
  if (!portals) return <div className="loader"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-head"><div><h1>Portals</h1><p className="muted">Manage portal names, links and availability — stored in the database, used everywhere.</p></div></div>
      {err && <div className="alert error">{err}</div>}
      <div className="manage-grid">
        {portals.map((p) => { const { Icon, color } = portalVisual(p.icon); return (
          <div className="manage-card" key={p.id}>
            <div className="mc-top">
              <span className="pc-icon" style={{ background: `${color}1a`, color }}><Icon size={22} /></span>
              <label className="switch" title="Active / Inactive">
                <input type="checkbox" checked={p.status === 'Active'} onChange={() => toggle(p)} /><span className="slider" />
              </label>
            </div>
            <h3>{p.name}</h3>
            <a className="mc-url" href={p.url} target="_blank" rel="noreferrer">{p.url} <ExternalLink size={12} /></a>
            <p className="mc-desc">{p.description || '—'}</p>
            <div className="mc-actions">
              <span className={`pc-status ${p.status === 'Active' ? 'on' : 'off'}`}>{p.status}</span>
              <button className="btn ghost sm" onClick={() => setEditing({ ...p })}><Pencil size={14} /> Edit</button>
            </div>
          </div>
        ); })}
      </div>

      {editing && (
        <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && setEditing(null)}>
          <div className="modal">
            <div className="modal-head"><h3>Edit portal</h3><button className="icon-btn" onClick={() => setEditing(null)}><X size={18} /></button></div>
            <div className="modal-body">
              {err && <div className="alert error">{err}</div>}
              <label className="field"><span>Portal name</span><input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></label>
              <label className="field"><span>URL</span><input value={editing.url} onChange={(e) => setEditing({ ...editing, url: e.target.value })} placeholder="https://…" /></label>
              <label className="field"><span>Description</span><textarea rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></label>
              <div className="grid2">
                <label className="field"><span>Icon</span><select value={editing.icon} onChange={(e) => setEditing({ ...editing, icon: e.target.value })}>{ICON_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}</select></label>
                <label className="field"><span>Status</span><select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}><option>Active</option><option>Inactive</option></select></label>
              </div>
            </div>
            <div className="modal-foot"><button className="btn" onClick={() => setEditing(null)}>Cancel</button><button className="btn primary" disabled={busy} onClick={save}><Save size={15} /> Save</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
