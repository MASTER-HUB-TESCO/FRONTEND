import { useState } from 'react';
import { ExternalLink, Circle } from 'lucide-react';
import { api } from '../api.js';
import { portalVisual } from './icons.jsx';

export default function PortalCard({ portal }) {
  const { Icon, color } = portalVisual(portal.icon);
  const [busy, setBusy] = useState(false);
  const inactive = portal.status !== 'Active';

  const open = async () => {
    setBusy(true);
    try {
      const d = await api(`/portals/${portal.id}/access`, { method: 'POST' });
      const target = d.url || portal.url;
      if (target) window.open(target, '_blank', 'noopener');
    } catch { if (portal.url) window.open(portal.url, '_blank', 'noopener'); }
    finally { setBusy(false); }
  };

  return (
    <div className={`portal-card ${inactive ? 'is-inactive' : ''}`} style={{ '--accent': color }}>
      <div className="pc-top">
        <span className="pc-icon" style={{ background: `${color}1a`, color }}><Icon size={24} /></span>
        <span className={`pc-status ${inactive ? 'off' : 'on'}`}><Circle size={8} /> {portal.status}</span>
      </div>
      <h3>{portal.name}</h3>
      <p>{portal.description || 'Company management system.'}</p>
      <button className="btn open" onClick={open} disabled={busy || inactive} title={inactive ? 'This portal is currently inactive' : `Open ${portal.name}`}>
        {inactive ? 'Unavailable' : busy ? 'Opening…' : <>Open Portal <ExternalLink size={15} /></>}
      </button>
    </div>
  );
}
