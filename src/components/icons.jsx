// Maps a portal's stored icon key (from the DB) to a lucide icon + an accent colour.
// Presentation only — portal names, URLs and status all come from the database.
import { Network, Users, ShoppingCart, Ruler, TrendingUp, HardHat, LayoutGrid, Boxes, PenTool, Briefcase } from 'lucide-react';

const MAP = {
  network: { Icon: Network, color: '#2563eb' },
  users: { Icon: Users, color: '#0891b2' },
  cart: { Icon: ShoppingCart, color: '#7c3aed' },
  ruler: { Icon: Ruler, color: '#db2777' },
  trending: { Icon: TrendingUp, color: '#059669' },
  hardhat: { Icon: HardHat, color: '#d97706' },
  boxes: { Icon: Boxes, color: '#2563eb' },
  design: { Icon: PenTool, color: '#db2777' },
  briefcase: { Icon: Briefcase, color: '#475569' },
  grid: { Icon: LayoutGrid, color: '#475569' },
};

export const portalVisual = (icon) => MAP[icon] || MAP.grid;
export const ICON_KEYS = Object.keys(MAP);
