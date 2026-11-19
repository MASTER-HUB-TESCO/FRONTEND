const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'mh_token';

export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY); } catch { return null; } };
export const setToken = (t, remember = true) => {
  try {
    localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY);
    if (t) (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, t);
  } catch { /* ignore */ }
};
export const replaceToken = (t) => { try { setToken(t, !!localStorage.getItem(TOKEN_KEY) || !sessionStorage.getItem(TOKEN_KEY)); } catch { /* ignore */ } };

export async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  let res;
  try { res = await fetch(`${BASE}/api${path}`, { method, headers, body: payload }); }
  catch { throw new Error('Cannot reach the server. Please check your connection and that the backend is running.'); }
  if (res.status === 401 && token) { setToken(null); window.dispatchEvent(new Event('mh-logout')); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
export const timeAgo = (iso) => {
  if (!iso) return '';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  if (s < 604800) return `${Math.floor(s / 86400)} d ago`;
  return fmtDateTime(iso);
};
