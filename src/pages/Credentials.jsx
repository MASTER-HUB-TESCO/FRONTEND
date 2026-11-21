import { useEffect, useMemo, useState } from 'react';
import { KeyRound, Plus, Search, Eye, EyeOff, Copy, Check, ExternalLink, Pencil, Trash2, X } from 'lucide-react';
import { api } from '../api.js';

const PORTAL_TYPES = ['Web', 'Mobile App', 'Both'];
const blankLogin = () => ({ lid: null, label: '', username: '', password: '', _show: false });
const blank = () => ({ appName: '', url: '', portalType: 'Web', description: '', logins: [blankLogin()] });
const normUrl = (u) => (u && !/^https?:\/\//i.test(u) ? `https://${u}` : u);

export default function Credentials() {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');

  const [editing, setEditing] = useState(null);   // null = closed, {} = new, {id,...} = edit
  const [form, setForm] = useState(blank());
  const [busy, setBusy] = useState(false);

  const [viewing, setViewing] = useState(null);    // credential being viewed
  const [revealed, setRevealed] = useState({});    // { `${id}:${lid}`: plaintext } — fetched on demand
  const [copied, setCopied] = useState('');        // key of the item just copied

  const load = () => api('/credentials').then((d) => setItems(d.credentials)).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    if (!items) return [];
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((c) => [c.appName, c.url, c.portalType, c.description, ...(c.logins || []).flatMap((l) => [l.label, l.username])]
      .filter(Boolean).join(' ').toLowerCase().includes(s));
  }, [items, q]);

  // ── password reveal (on-demand per login, never shipped in the list) ──
  const getPassword = async (id, lid) => {
    const key = `${id}:${lid}`;
    if (revealed[key] !== undefined) return revealed[key];
    const d = await api(`/credentials/${id}/logins/${encodeURIComponent(lid)}/password`);
    setRevealed((r) => ({ ...r, [key]: d.password || '' }));
    return d.password || '';
  };
  const toggleReveal = async (id, lid) => {
    const key = `${id}:${lid}`;
    if (revealed[key] !== undefined) { setRevealed((r) => { const n = { ...r }; delete n[key]; return n; }); return; }
    try { await getPassword(id, lid); } catch (e) { setErr(e.message); }
  };
  const flagCopied = (key) => { setCopied(key); setTimeout(() => setCopied((c) => (c === key ? '' : c)), 1200); };
  const copy = async (text, key) => {
    if (!text) return;
    try { await navigator.clipboard.writeText(text); flagCopied(key); }
    catch { setErr('Could not copy to clipboard.'); }
  };
  const copyPassword = async (id, lid, key) => {
    try { const pw = await getPassword(id, lid); await copy(pw, key); } catch (e) { setErr(e.message); }
  };

  // ── add / edit ──
  const openNew = () => { setForm(blank()); setErr(''); setEditing({}); };
  const openEdit = (c) => {
    setErr('');
    setForm({
      appName: c.appName || '', url: c.url || '', portalType: c.portalType || 'Web', description: c.description || '',
      logins: (c.logins && c.logins.length ? c.logins : [{}]).map((l) => ({ lid: l.lid || null, label: l.label || '', username: l.username || '', password: '', _show: false })),
    });
    setEditing(c);
  };
  const closeEdit = () => { setEditing(null); setForm(blank()); };

  const setLogin = (i, k, v) => setForm((f) => ({ ...f, logins: f.logins.map((l, j) => (j === i ? { ...l, [k]: v } : l)) }));
  const addLogin = () => setForm((f) => ({ ...f, logins: [...f.logins, blankLogin()] }));
  const removeLogin = (i) => setForm((f) => ({ ...f, logins: f.logins.length > 1 ? f.logins.filter((_, j) => j !== i) : f.logins }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.appName.trim()) { setErr('Application / Portal name is required'); return; }
    const logins = form.logins
      .map((l) => ({ lid: l.lid || undefined, label: l.label.trim(), username: l.username.trim(), password: l.password }))
      .filter((l) => l.username || l.label || l.password || l.lid);
    if (logins.length === 0) { setErr('Add at least one login (username and/or password).'); return; }
    const body = { appName: form.appName, url: form.url, portalType: form.portalType, description: form.description, logins };
    setBusy(true); setErr('');
    try {
      if (editing && editing.id) {
        await api(`/credentials/${editing.id}`, { method: 'PUT', body });
        setRevealed((r) => { const n = { ...r }; Object.keys(n).forEach((k) => k.startsWith(editing.id + ':') && delete n[k]); return n; });
      } else {
        await api('/credentials', { method: 'POST', body });
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

  // One login line (shared by table + view modal).
  const LoginLine = ({ c, l, kp }) => {
    const key = `${c.id}:${l.lid}`;
    const shown = revealed[key] !== undefined;
    return (
      <div className="cred-login">
        <span className="login-col-label">{l.label ? <span className="login-chip">{l.label}</span> : null}</span>
        <span className="login-col-user cred-copy">
          <span className="cred-val" title={l.username || ''}>{l.username || '—'}</span>
          {l.username && <button className="icon-btn xs" title="Copy username" onClick={() => copy(l.username, `u:${kp}`)}>{copied === `u:${kp}` ? <Check size={14} /> : <Copy size={14} />}</button>}
        </span>
        <span className="login-col-pass cred-copy">
          {l.hasPassword ? (
            <>
              <span className="cred-val mono">{shown ? (revealed[key] || '—') : '••••••••'}</span>
              <button className="icon-btn xs" title={shown ? 'Hide' : 'Show'} onClick={() => toggleReveal(c.id, l.lid)}>{shown ? <EyeOff size={14} /> : <Eye size={14} />}</button>
              <button className="icon-btn xs" title="Copy password" onClick={() => copyPassword(c.id, l.lid, `p:${kp}`)}>{copied === `p:${kp}` ? <Check size={14} /> : <Copy size={14} />}</button>
            </>
          ) : <span className="muted">no password</span>}
        </span>
      </div>
    );
  };

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
              <tr><th>Application</th><th>Type</th><th>Logins</th><th>Portal</th><th className="ta-r">Actions</th></tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="cred-app">{c.appName}</div>
                    {c.description && <div className="cred-sub">{c.description}</div>}
                  </td>
                  <td><span className={`badge type-${c.portalType.replace(/\s/g, '')}`}>{c.portalType}</span></td>
                  <td>
                    <div className="cred-logins">
                      {(c.logins || []).map((l) => <LoginLine key={l.lid} c={c} l={l} kp={`${c.id}:${l.lid}`} />)}
                    </div>
                  </td>
                  <td>{c.url ? <button className="btn xs open-portal" onClick={() => openPortal(c.url)} title={c.url}><ExternalLink size={13} /> Open</button> : <span className="muted">—</span>}</td>
                  <td className="ta-r">
                    <div className="cred-acts">
                      <button className="icon-btn" title="View" onClick={() => setViewing(c)}><Eye size={16} /></button>
                      <button className="icon-btn" title="Edit" onClick={() => openEdit(c)}><Pencil size={16} /></button>
                      <button className="icon-btn danger" title="Delete" onClick={() => del(c)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add / Edit modal ── */}
      {editing && (
        <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && closeEdit()}>
          <form className="modal cred-modal" onSubmit={save}>
            <div className="modal-head"><h3>{editing.id ? 'Edit credentials' : 'Add credentials'}</h3><button type="button" className="icon-btn" onClick={closeEdit}><X size={18} /></button></div>
            <div className="modal-body">
              {err && <div className="alert error">{err}</div>}
              <label className="field"><span>Application / Portal name *</span><input value={form.appName} onChange={(e) => setForm({ ...form, appName: e.target.value })} placeholder="e.g. Tesco ERM" required /></label>
              <label className="field"><span>Portal URL</span><input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://portal.example.com" /></label>

              <div className="logins-head"><span>Logins</span><button type="button" className="btn ghost xs" onClick={addLogin}><Plus size={14} /> Add login</button></div>
              {form.logins.map((l, i) => (
                <div className="login-card" key={i}>
                  <div className="login-card-head">
                    <span className="login-no">Login {i + 1}</span>
                    {form.logins.length > 1 && <button type="button" className="icon-btn xs danger" title="Remove login" onClick={() => removeLogin(i)}><Trash2 size={14} /></button>}
                  </div>
                  <label className="field"><span>Label (optional)</span><input value={l.label} onChange={(e) => setLogin(i, 'label', e.target.value)} placeholder="e.g. Vimal, Admin" /></label>
                  <label className="field"><span>Login username / email</span><input value={l.username} onChange={(e) => setLogin(i, 'username', e.target.value)} placeholder="username or email" /></label>
                  <label className="field"><span>Password</span>
                    <span className="pw-field">
                      <input type={l._show ? 'text' : 'password'} value={l.password} onChange={(e) => setLogin(i, 'password', e.target.value)} placeholder={l.lid ? 'Leave blank to keep current password' : 'Password'} autoComplete="new-password" />
                      <button type="button" className="icon-btn" tabIndex={-1} onClick={() => setLogin(i, '_show', !l._show)} title={l._show ? 'Hide' : 'Show'}>{l._show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </span>
                  </label>
                </div>
              ))}

              <div className="grid-2" style={{ marginTop: 4 }}>
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
        const c = viewing;
        return (
          <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && setViewing(null)}>
            <div className="modal">
              <div className="modal-head"><h3>{c.appName}</h3><button className="icon-btn" onClick={() => setViewing(null)}><X size={18} /></button></div>
              <div className="modal-body cred-view">
                <div className="cv-row"><span className="cv-l">Type</span><span className={`badge type-${c.portalType.replace(/\s/g, '')}`}>{c.portalType}</span></div>
                <div className="cv-row"><span className="cv-l">Portal URL</span>{c.url ? <a className="link cv-link" href={normUrl(c.url)} target="_blank" rel="noopener noreferrer">{c.url}</a> : <span className="muted">—</span>}</div>
                <div className="cv-row"><span className="cv-l">Logins</span>
                  <div className="cred-logins">
                    {(c.logins || []).map((l) => <LoginLine key={l.lid} c={c} l={l} kp={`v:${c.id}:${l.lid}`} />)}
                  </div>
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
