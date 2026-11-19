import { useEffect, useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Building2, Network, Users, ShoppingCart, Ruler, TrendingUp, HardHat, User, Lock, ArrowRight, Lock as LockMini } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import HubGraphic from '../components/HubGraphic.jsx';

const PORTAL_PREVIEW = [
  { Icon: Network, label: 'ERM' }, { Icon: Users, label: 'HRMS' }, { Icon: ShoppingCart, label: 'Procurement' },
  { Icon: Ruler, label: 'Design' }, { Icon: TrendingUp, label: 'Sales' }, { Icon: HardHat, label: 'Execution' },
];

export default function Login() {
  const { login } = useAuth();
  const [mode, setMode] = useState('login'); // login | setup
  const [f, setF] = useState({ name: '', username: '', password: '', email: '' });
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  useEffect(() => { api('/auth/setup-status').then((d) => { if (d.needsSetup) setMode('setup'); }).catch(() => {}); }, []);

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const d = mode === 'setup'
        ? await api('/auth/setup', { method: 'POST', body: { name: f.name, username: f.username, email: f.email, password: f.password } })
        : await api('/auth/login', { method: 'POST', body: { username: f.username, password: f.password } });
      login(d.token, d.user, remember);
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };

  return (
    <div className="auth">
      <section className="auth-brand-panel">
        <div className="brand-grid-bg" aria-hidden />
        <div className="brand-inner">
          <div className="brand-row"><img className="brand-logo-img" src="/tescologo-light.png" alt="Tesco Structures" /><span className="brand-tag">MASTER HUB</span></div>
          <h1>One Company.<br />All Systems.<br /><span className="accent">One Master Hub.</span></h1>
          <p>The central executive gateway to every Tesco Structures system — secure, unified access for the Managing Directors from a single professional dashboard.</p>
          <HubGraphic />
          <div className="brand-portals">
            {PORTAL_PREVIEW.map(({ Icon, label }) => (
              <div className="bp" key={label}><span className="bp-ic"><Icon size={16} /></span>{label}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="auth-card-panel">
        <div className="auth-card">
          <div className="auth-logo"><img className="auth-logo-img" src="/tescologo2.png" alt="Tesco Structures" /><span className="al-sub">Master Hub</span></div>
          <div className="secure-pill"><ShieldCheck size={13} /> Secure sign-in</div>
          <h2>{mode === 'setup' ? 'Get started' : 'Welcome back'}</h2>
          <p className="muted">{mode === 'setup' ? 'Create the first Managing Director account.' : 'Sign in to continue to your dashboard.'}</p>

          <form onSubmit={submit}>
            {err && <div className="alert error">{err}</div>}

            {mode === 'setup' && (
              <Field label="Full name" icon={User}><input value={f.name} onChange={set('name')} placeholder="Managing Director name" required /></Field>
            )}
            {mode === 'setup' && (
              <Field label="Email (optional)" icon={User}><input type="email" value={f.email} onChange={set('email')} placeholder="name@tesco.com" /></Field>
            )}

            <Field label={mode === 'setup' ? 'Username' : 'Username or email'} icon={User}>
              <input value={f.username} onChange={set('username')} autoCapitalize="none" autoComplete="username" placeholder="e.g. md1" required />
            </Field>

            <Field label="Password" icon={Lock}>
              <input type={show ? 'text' : 'password'} value={f.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'login' ? undefined : 8} placeholder="Enter your password" required />
              <button type="button" className="pw-eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </Field>

            {mode === 'login' && (
              <label className="check remember"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Keep me signed in</label>
            )}

            <button className="btn primary block lg" disabled={busy}>
              {busy ? 'Please wait…' : <>{mode === 'setup' ? 'Create account & continue' : 'Sign in'} <ArrowRight size={17} /></>}
            </button>
          </form>

          <div className="auth-foot"><LockMini size={13} /> Authorised Managing Directors only · No public registration</div>
        </div>
        <div className="auth-copyright">© {new Date().getFullYear()} Tesco Structures · Master Hub</div>
      </section>
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="ipt">{Icon && <Icon className="ipt-ic" size={16} />}{children}</div>
    </label>
  );
}
