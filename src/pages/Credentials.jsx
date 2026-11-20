import { useEffect, useMemo, useState } from 'react';
import { KeyRound, Plus, Search, Eye, EyeOff, Copy, Check, ExternalLink, Pencil, Trash2, X } from 'lucide-react';
import { api } from '../api.js';

const PORTAL_TYPES = ['Web', 'Mobile App', 'Both'];
const blank = () => ({ appName: '', url: '', username: '', password: '', portalType: 'Web', description: '' });
const normUrl = (u) => (u && !/^https?:\/\//i.test(u) ? `https://${u}` : u);

export default function Credentials() {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');

  // add / edit modal
  const [editing, setEditing] = useState(null);   // null = closed, {} = new, {id,...} = edit
  const [form, setForm] = useState(blank());
  const [showFormPw, setShowFormPw] = useState(false);
  const [busy, setBusy] = useState(false);

  const [viewing, setViewing] = useState(null);    // credential being viewed
  const [revealed, setRevealed] = useState({});    // { id: plaintext } — only fetched on demand
  const [copied, setCopied] = useState('');        // key of the item just copied

  const load = () => api('/credentials').then((d) => setItems(d.credentials)).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    if (!items) return [];
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((c) => [c.appName, c.username, c.url, c.portalType, c.description].filter(Boolean).join(' ').toLowerCase().includes(s));
  }, [items, q]);

  // ── password reveal (on-demand, never shipped in the list) ──
  const getPassword = async (id) => {
    if (revealed[id] !== undefined) return revealed[id];
    const d = await api(`/credentials/${id}/password`);
    setRevealed((r) => ({ ...r, [id]: d.password || '' }));
    return d.password || '';
  };
  const toggleReveal = async (id) => {
    if (revealed[id] !== undefined) { setRevealed((r) => { const n = { ...r }; delete n[id]; return n; }); return; }
    try { await getPassword(id); } catch (e) { setErr(e.message); }
  };
  const flagCopied = (key) => { setCopied(key); setTimeout(() => setCopied((c) => (c === key ? '' : c)), 1200); };
  const copy = async (text, key) => {
    if (!text) return;
    try { await navigator.clipboard.writeText(text); flagCopied(key); }
    catch { setErr('Could not copy to clipboard.'); }
  };
  const copyPassword = async (id, key) => {
    try { const pw = await getPassword(id); await copy(pw, key); } catch (e) { setErr(e.message); }
  };

  // ── add / edit ──
  const openNew = () => { setForm(blank()); setShowFormPw(false); setErr(''); setEditing({}); };
  const openEdit = (c) => { setForm({ appName: c.appName || '', url: c.url || '', username: c.username || '', password: '', portalType: c.portalType || 'Web', description: c.description || '' }); setShowFormPw(false); setErr(''); setEditing(c); };
  const closeEdit = () => { setEditing(null); setForm(blank()); };

  const save = async (e) => {
    e.preventDefault();
    if (!form.appName.trim()) { setErr('Application / Portal name is required'); return; }
    setBusy(true); setErr('');
    try {
      if (editing && editing.id) {
        await api(`/credentials/${editing.id}`, { method: 'PUT', body: form });
        setRevealed((r) => { const n = { ...r }; delete n[editing.id]; return n; }); // drop any cached old password
      } else {
        await api('/credentials', { method: 'POST', body: form });
      }
      closeEdit();
      load();
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };

  const del = async (c) => {
    if (!window.confirm(`Delete the credentials for "${c.appName}"? This cannot be undone.`)) return;
    try { await api(`/credentials/${c.id}`, { method: 'DELETE' }); load(); }
    catch (e) { setErr(e.message); }
  };

  const openPortal = (url) => { const u = normUrl(url); if (u) window.open(u, '_blank', 'noopener'); };

  return (
    <div>
      <div className="page-head">
        <div><h1>Credentials</h1><p className="muted">Login credentials for all company applications and portals — one secure place.</p></div>
        <button className="btn primary" onClick={openNew}><Plus size={16} /> Add Credentials</button>
      </div>

      {err && <div className="alert error">{err}</div>}

      {items && items.length > 0 && (
        <div className="cred-search">
          <Search size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search application, username, URL…" aria-label="Search credentials" />
          {q && <button className="icon-btn" onClick={() => setQ('')} aria-label="Clear"><X size={15} /></button>}
        </div>
      )}

      {!items ? (
        <div className="loader"><div className="spinner" /></div>
      ) : items.length === 0 ? (
        <div className="empty-soft"><KeyRound size={30} /><div>No credentials stored yet.</div><button className="btn primary sm" onClick={openNew}><Plus size={15} /> Add your first application</button></div>
      ) : rows.length === 0 ? (
        <div className="empty-soft"><Search size={26} /><div>No applications match “{q}”.</div></div>
      ) : (
        <div className="table-wrap cred-table">
          <table className="table">
            <thead>
              <tr>
                <th>Application</th><th>Type</th><th>Username / Email</th><th>Password</th><th>Portal</th><th className="ta-r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const shown = revealed[c.id] !== undefined;
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="cred-app">{c.appName}</div>
                      {c.description && <div className="cred-sub">{c.description}</div>}
                    </td>
                    <td><span className={`badge type-${c.portalType.replace(/\s/g, '')}`}>{c.portalType}</span></td>
                    <td>
                      {c.username ? (
                        <span className="cred-copy">
                          <span className="cred-val">{c.username}</span>
                          <button className="icon-btn xs" title="Copy username" onClick={() => copy(c.username, `u:${c.id}`)}>
                            {copied === `u:${c.id}` ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </span>
                      ) : <span className="muted">—</span>}
                    </td>
                    <td>
                      {c.hasPassword ? (
                        <span className="cred-copy">
                          <span className="cred-val mono">{shown ? (revealed[c.id] || '—') : '••••••••'}</span>
                          <button className="icon-btn xs" title={shown ? 'Hide' : 'Show'} onClick={() => toggleReveal(c.id)}>
                            {shown ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button className="icon-btn xs" title="Copy password" onClick={() => copyPassword(c.id, `p:${c.id}`)}>
                            {copied === `p:${c.id}` ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </span>
                      ) : <span className="muted">—</span>}
                    </td>
                    <td>
                      {c.url ? <button className="btn xs open-portal" onClick={() => openPortal(c.url)} title={c.url}><ExternalLink size={13} /> Open</button> : <span className="muted">—</span>}
                    </td>
                    <td className="ta-r">
                      <div className="cred-acts">
                        <button className="icon-btn" title="View" onClick={() => setViewing(c)}><Eye size={16} /></button>
                        <button className="icon-btn" title="Edit" onClick={() => openEdit(c)}><Pencil size={16} /></button>
                        <button className="icon-btn danger" title="Delete" onClick={() => del(c)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add / Edit modal ── */}
      {editing && (
        <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && closeEdit()}>
          <form className="modal" onSubmit={save}>
            <div className="modal-head"><h3>{editing.id ? 'Edit credentials' : 'Add credentials'}</h3><button type="button" className="icon-btn" onClick={closeEdit}><X size={18} /></button></div>
            <div className="modal-body">
              {err && <div className="alert error">{err}</div>}
              <label className="field"><span>Application / Portal name *</span><input value={form.appName} onChange={(e) => setForm({ ...form, appName: e.target.value })} placeholder="e.g. Tesco Procurement" required /></label>
              <label className="field"><span>Portal URL</span><input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://portal.example.com" /></label>
              <label className="field"><span>Login username / email</span><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="username or email" /></label>
              <label className="field"><span>Password</span>
                <span className="pw-field">
                  <input type={showFormPw ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editing.id ? 'Leave blank to keep current password' : 'Password'} autoComplete="new-password" />
                  <button type="button" className="icon-btn" tabIndex={-1} onClick={() => setShowFormPw((v) => !v)} title={showFormPw ? 'Hide' : 'Show'}>{showFormPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </span>
              </label>
              <div className="grid-2">
                <label className="field"><span>Portal type</span>
                  <select value={form.portalType} onChange={(e) => setForm({ ...form, portalType: e.target.value })}>
                    {PORTAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
              </div>
              <label className="field"><span>Description (optional)</span><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Any note about this application" /></label>
            </div>
            <div className="modal-foot"><button type="button" className="btn" onClick={closeEdit}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : editing.id ? 'Save changes' : 'Save'}</button></div>
          </form>
        </div>
      )}

      {/* ── View modal ── */}
      {viewing && (() => {
        const c = viewing; const shown = revealed[c.id] !== undefined;
        return (
          <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && setViewing(null)}>
            <div className="modal">
              <div className="modal-head"><h3>{c.appName}</h3><button className="icon-btn" onClick={() => setViewing(null)}><X size={18} /></button></div>
              <div className="modal-body cred-view">
                <div className="cv-row"><span className="cv-l">Type</span><span className={`badge type-${c.portalType.replace(/\s/g, '')}`}>{c.portalType}</span></div>
                <div className="cv-row"><span className="cv-l">Portal URL</span>{c.url ? <a className="link cv-link" href={normUrl(c.url)} target="_blank" rel="noopener noreferrer">{c.url}</a> : <span className="muted">—</span>}</div>
                <div className="cv-row"><span className="cv-l">Username / Email</span>
                  {c.username ? <span className="cred-copy"><span className="cred-val">{c.username}</span><button className="icon-btn xs" onClick={() => copy(c.username, `vu:${c.id}`)} title="Copy">{copied === `vu:${c.id}` ? <Check size={14} /> : <Copy size={14} />}</button></span> : <span className="muted">—</span>}
                </div>
                <div className="cv-row"><span className="cv-l">Password</span>
                  {c.hasPassword ? (
                    <span className="cred-copy">
                      <span className="cred-val mono">{shown ? (revealed[c.id] || '—') : '••••••••'}</span>
                      <button className="icon-btn xs" onClick={() => toggleReveal(c.id)} title={shown ? 'Hide' : 'Show'}>{shown ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                      <button className="icon-btn xs" onClick={() => copyPassword(c.id, `vp:${c.id}`)} title="Copy">{copied === `vp:${c.id}` ? <Check size={14} /> : <Copy size={14} />}</button>
                    </span>
                  ) : <span className="muted">—</span>}
                </div>
                {c.description && <div className="cv-row"><span className="cv-l">Description</span><span>{c.description}</span></div>}
              </div>
              <div className="modal-foot">
                {c.url && <button className="btn" onClick={() => openPortal(c.url)}><ExternalLink size={15} /> Open portal</button>}
                <button className="btn primary" onClick={() => { setViewing(null); openEdit(c); }}><Pencil size={15} /> Edit</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
