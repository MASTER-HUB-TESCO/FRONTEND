import { Network, Users, ShoppingCart, Ruler, TrendingUp, HardHat } from 'lucide-react';

// Central Master Hub connected to the six company portals — a live hub-and-spoke map.
const NODES = [
  { Icon: Network, label: 'ERM', color: '#3b82f6', x: 17, y: 18 },
  { Icon: ShoppingCart, label: 'Procurement', color: '#8b5cf6', x: 17, y: 50 },
  { Icon: TrendingUp, label: 'Sales', color: '#22c55e', x: 17, y: 82 },
  { Icon: Users, label: 'HRMS', color: '#06b6d4', x: 83, y: 18 },
  { Icon: Ruler, label: 'Design', color: '#ec4899', x: 83, y: 50 },
  { Icon: HardHat, label: 'Execution', color: '#f59e0b', x: 83, y: 82 },
];

export default function HubGraphic() {
  return (
    <div className="hub-graphic" role="img" aria-label="Master Hub connecting ERM, HRMS, Procurement, Design, Sales and Execution">
      <svg className="hg-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
        {NODES.map((n, i) => <line key={i} x1="50" y1="50" x2={n.x} y2={n.y} />)}
      </svg>
      {NODES.map((n, i) => <span key={`d${i}`} className="hg-end" style={{ left: `${n.x}%`, top: `${n.y}%`, background: n.color }} />)}
      <div className="hg-center">
        <img src="/favicon.png" alt="" />
        <span>MASTER HUB</span>
      </div>
      {NODES.map((n, i) => (
        <div key={i} className={`hg-node ${n.x < 50 ? 'l' : 'r'}`} style={{ left: `${n.x}%`, top: `${n.y}%` }}>
          <span className="hg-ic" style={{ background: `${n.color}26`, color: n.color }}><n.Icon size={15} /></span>
          <span className="hg-label">{n.label}</span>
        </div>
      ))}
    </div>
  );
}
