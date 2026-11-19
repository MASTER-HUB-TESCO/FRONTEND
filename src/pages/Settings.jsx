import { useEffect, useState } from 'react';
import { KeyRound, UserPlus, RotateCcw, Power, Copy, Check, X } from 'lucide-react';
import { api, replaceToken } from '../api.js';
import { useAuth } from '../auth.jsx';

export default function Settings() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', email: '', title: 'Managing Director', password: '' });
  const [cred, setCred] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = () => api('/users').then(setData).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  const changePw = async (e) => {
    e.preventDefault(); setErr(''); setPwMsg('');
    if (pw.newPassword !== pw.confirm) { setErr('New passwords do not match'); return; }
    setBusy(true);
    try { const d = await api('/auth/change-password', { method: 'POST', body: { currentPassword: pw.currentPassword, newPassword: pw.newPassword } }); if (d.token) replaceToken(d.token); setPwMsg('Password updated'); setPw({ currentPassword: '', newPassword: '', confirm: '' }); }
    catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };
  const addMd = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { const d = await api('/users', { method: 'POST', body: form }); setCred(d.credentials); setOpen(false); setForm({ name: '', username: '', email: '', title: 'Managing Director', password: '' }); load(); }
    catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };
  const reset = async (u) => { if (!window.confirm(`Reset password for ${u.name}?`)) return; try { const d = await api(`/users/${u.id}/reset-password`, { method: 'POST', body: {} }); setCred(d.credentials); } catch (e) { setErr(e.message); } };
  const toggle = async (u) => { try { await api(`/users/${u.id}/active`, { method: 'POST', body: { active: !u.active } }); load(); } catch (e) { setErr(e.message); } };

  const users = data?.users || [];
  const atMax = data && users.length >= (data.max || 3);

  return (
    <div className="narrow">
      <div className="page-head"><div><h1>Settings</h1><p className="muted">Your account and the Managing Director logins.</p></div></div>
      {err && <div className="alert error">{err}</div>}
      {cred && <Cred c={cred} onClose={() => setCred(null)} />}

      <section className="block card">
        <h2>Change password</h2>
        <form onSubmit={changePw} className="form-col">
          {pwMsg && <div className="alert ok">{pwMsg}</div>}
          <label className="field"><span>Current password</span><input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required /></label>
          <div className="grid2">
            <label className="field"><span>New password</span><input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} minLength={8} required /></label>
            <label className="field"><span>Confirm</span><input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} minLength={8} required /></label>
          </div>
          <button className="btn primary" disabled={busy}><KeyRound size={15} /> Update password</button>
        </form>
      </section>

      <section className="block card">
        <div className="block-head"><h2>Managing Directors</h2>
          <button className="btn primary sm" disabled={atMax} title={atMax ? 'Maximum MD accounts reached' : ''} onClick={() => { setErr(''); setOpen(true); }}><UserPlus size={15} /> Add MD</button></div>
        {!data ? <div className="loader"><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Username</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td><b>{u.name}</b><div className="muted small">{u.title}</div></td>
                    <td>{u.username}</td>
                    <td>{u.active ? <span className="pc-status on">Active</span> : <span className="pc-status off">Disabled</span>}</td>
                    <td className="row-actions">
                      <button className="btn ghost xs" onClick={() => reset(u)}><RotateCcw size={13} /> Reset</button>
                      {u.id !== user.id && <button className="btn ghost xs" onClick={() => toggle(u)}><Power size={13} /> {u.active ? 'Disable' : 'Enable'}</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted small">Up to {data?.max || 3} Managing Director accounts · no public registration.</p>
      </section>

      {open && (
        <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <form className="modal" onSubmit={addMd}>
            <div className="modal-head"><h3>Add Managing Director</h3><button type="button" className="icon-btn" onClick={() => setOpen(false)}><X size={18} /></button></div>
            <div className="modal-body">
              {err && <div className="alert error">{err}</div>}
              <label className="field"><span>Full name *</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
              <div className="grid2">
                <label className="field"><span>Username</span><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="auto if blank" autoCapitalize="none" /></label>
                <label className="field"><span>Email</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              </div>
              <label className="field"><span>Password</span><input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="auto-generate if blank" /></label>
            </div>
            <div className="modal-foot"><button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Creating…' : 'Create'}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}

function Cred({ c, onClose }) {
  const [copied, setCopied] = useState(false);
  const text = `Tesco Master Hub login\nUsername: ${c.username}\nPassword: ${c.password}`;
  return (
    <div className="cred">
      <div><b>Share these credentials now</b> — the password is shown only once.<br />Username: <code>{c.username}</code> · Password: <code>{c.password}</code></div>
      <div className="row-actions">
        <button className="btn ghost sm" onClick={() => { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}>{copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}</button>
        <button className="btn ghost sm" onClick={onClose}>Dismiss</button>
      </div>
    </div>
  );
}
