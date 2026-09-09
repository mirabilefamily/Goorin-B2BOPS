import { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  BookMarked,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Package,
  Search,
  ShoppingBag,
} from 'lucide-react';
import './dashboard.css';

type Props = { name: string; onNavigate: (label: string) => void };

type Order = {
  id: string;
  date: string;
  shipDate: string;
  estimated: boolean;
  items: number;
  total: number;
  status: 'Open' | 'Shipped' | 'Delivered' | 'Cancelled';
  payment: 'Partially Paid' | 'Not invoiced' | 'Paid' | 'Refunded';
};

const orders: Order[] = [
  { id: 'SO58739', date: '2026-09-02', shipDate: '2027-01-06', estimated: true, items: 2, total: 17, status: 'Open', payment: 'Not invoiced' },
  { id: 'SO57017', date: '2026-08-27', shipDate: '2027-01-06', estimated: true, items: 2, total: 17, status: 'Open', payment: 'Partially Paid' },
  { id: 'SO56680', date: '2026-08-25', shipDate: '2026-08-25', estimated: true, items: 2, total: 17, status: 'Open', payment: 'Partially Paid' },
  { id: 'SO55912', date: '2026-07-14', shipDate: '2026-07-19', estimated: false, items: 24, total: 1128, status: 'Delivered', payment: 'Paid' },
  { id: 'SO55340', date: '2026-06-03', shipDate: '2026-06-09', estimated: false, items: 12, total: 564, status: 'Delivered', payment: 'Paid' },
  { id: 'SO54871', date: '2026-04-22', shipDate: '2026-04-28', estimated: false, items: 36, total: 1692, status: 'Shipped', payment: 'Paid' },
  { id: 'SO54102', date: '2026-03-11', shipDate: '2026-03-15', estimated: false, items: 6, total: 282, status: 'Cancelled', payment: 'Refunded' },
  { id: 'SO53559', date: '2026-01-28', shipDate: '2026-02-02', estimated: false, items: 18, total: 846, status: 'Delivered', payment: 'Paid' },
];

const spend = [0, 0, 0, 0, 0, 0, 0, 0, 0, 34, 51, 51, 44];

const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
const fmtDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const yearProgress = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1).getTime();
  const end = new Date(now.getFullYear() + 1, 0, 1).getTime();
  return Math.round(((now.getTime() - start) / (end - start)) * 100);
};

function Sparkline() {
  const w = 520;
  const h = 90;
  const max = Math.max(...spend, 1);
  const pts = spend.map((v, i) => [(i / (spend.length - 1)) * w, h - 6 - (v / max) * (h - 14)]);
  const d = pts.map(([x, y], i) => {
    if (i === 0) return `M${x},${y}`;
    const [px, py] = pts[i - 1];
    const cx = (px + x) / 2;
    return `C${cx},${py} ${cx},${y} ${x},${y}`;
  }).join(' ');
  return (
    <svg className="dash-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="dash-spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00d4a1" stopOpacity=".35" />
          <stop offset="100%" stopColor="#00d4a1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${w},${h} L0,${h} Z`} fill="url(#dash-spark-fill)" />
      <path d={d} fill="none" stroke="#00d4a1" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" fill="#00d4a1" />
    </svg>
  );
}

type SortKey = 'id' | 'date' | 'shipDate' | 'items' | 'total' | 'status';

const columns: { key: SortKey; label: string }[] = [
  { key: 'id', label: 'Order' },
  { key: 'date', label: 'Date' },
  { key: 'shipDate', label: 'Ship date' },
  { key: 'items', label: 'Items' },
  { key: 'total', label: 'Total' },
  { key: 'status', label: 'Status' },
];

const statusTone: Record<Order['status'], string> = { Open: 'blue', Shipped: 'teal', Delivered: 'green', Cancelled: 'grey' };
const paymentTone: Record<Order['payment'], string> = { 'Partially Paid': 'amber', 'Not invoiced': 'grey', Paid: 'green', Refunded: 'grey' };

function OrdersTable({ onViewAll }: { onViewAll: () => void }) {
  const [scope, setScope] = useState<'recent' | 'all'>('recent');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'desc' });

  const rows = useMemo(() => {
    const base = scope === 'recent' ? orders.slice(0, 3) : orders;
    const q = query.trim().toLowerCase();
    const filtered = q ? base.filter((o) => [o.id, o.status, o.payment].some((s) => s.toLowerCase().includes(q))) : base;
    return [...filtered].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [scope, query, sort]);

  const toggleSort = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));

  const exportCsv = () => {
    const head = 'Order,Date,Ship date,Items,Total,Status,Payment';
    const body = rows.map((o) => [o.id, o.date, o.shipDate, o.items, o.total.toFixed(2), o.status, o.payment].join(','));
    const blob = new Blob([[head, ...body].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `goorin-orders-${scope}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <section className="dash-orders" data-testid="recent-orders-card">
      <div className="dash-orders-head">
        <div><h2>{scope === 'recent' ? 'Recent Orders' : 'All Orders'}</h2><p>{scope === 'recent' ? 'Your latest purchase history' : 'Every order placed on this account'}</p></div>
        <div className="dash-segment" role="tablist">
          <button role="tab" aria-selected={scope === 'recent'} className={scope === 'recent' ? 'active' : ''} onClick={() => setScope('recent')} data-testid="orders-scope-recent">Recent</button>
          <button role="tab" aria-selected={scope === 'all'} className={scope === 'all' ? 'active' : ''} onClick={() => setScope('all')} data-testid="orders-scope-all">All Orders</button>
        </div>
      </div>
      <div className="dash-orders-tools">
        <label className="dash-search"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by order # or status..." data-testid="orders-search-input" /></label>
        <button className="dash-export" onClick={exportCsv} data-testid="orders-export-btn"><Download size={16} /> Export</button>
      </div>
      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>
                  <button onClick={() => toggleSort(c.key)} className={sort.key === c.key ? 'sorted' : ''} data-testid={`orders-sort-${c.key}`}>
                    {c.label}
                    {sort.key === c.key ? (sort.dir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} />}
                  </button>
                </th>
              ))}
              <th aria-label="Open" />
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} data-testid={`order-row-${o.id}`}>
                <td className="dash-td-id">{o.id}</td>
                <td>{fmtDate(o.date)}</td>
                <td>{o.estimated ? `Est. ${fmtDate(o.shipDate)}` : fmtDate(o.shipDate)}</td>
                <td>{o.items} units</td>
                <td className="dash-td-total">{money(o.total)}</td>
                <td><span className={`dash-pill tone-${statusTone[o.status]}`}><i />{o.status}</span><span className={`dash-pill tone-${paymentTone[o.payment]}`}>{o.payment}</span></td>
                <td className="dash-td-chevron"><ChevronRight size={17} /></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="dash-empty">No orders match “{query}”.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="dash-orders-foot">
        <span data-testid="orders-count">Showing {rows.length} of {scope === 'recent' ? Math.min(3, orders.length) : orders.length} orders</span>
        <button onClick={onViewAll} data-testid="orders-view-all-btn">View All Orders <ChevronRight size={16} /></button>
      </div>
    </section>
  );
}

export default function DashboardPage({ name, onNavigate }: Props) {
  const progress = yearProgress();
  const openOrders = orders.filter((o) => o.status === 'Open');
  const openAmount = openOrders.reduce((s, o) => s + o.total, 0);
  const ytd = spend.reduce((s, v) => Math.max(s, v), 0);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const actions = [
    { label: 'Marketplace', title: 'Browse Catalog', sub: 'Shop now', icon: ShoppingBag, tone: 'ink' },
    { label: 'Pre-Book', title: 'Pre-Book Orders', sub: 'Plan upcoming seasonal orders', icon: BookOpen, tone: 'blue' },
    { label: 'My Orders', title: 'Track Orders', sub: `${openOrders.length} open order${openOrders.length === 1 ? '' : 's'}`, icon: Package, tone: 'green' },
    { label: 'Resources', title: 'Resources', sub: 'Line sheets & brand assets', icon: BookMarked, tone: 'amber' },
  ];

  return (
    <div className="dash" data-testid="dashboard-page">
      <header className="dash-hero">
        <div>
          <p className="dash-eyebrow">The Goorin Bros. B2B Portal</p>
          <h1 data-testid="dashboard-greeting">{greeting()}, {name}.</h1>
        </div>
        <div className="dash-hero-meta">
          <span>{today}</span>
          <span className="dash-live"><i />Live data · synced just now</span>
        </div>
      </header>

      <div className="dash-stats">
        <article className="dash-card dash-card-dark" data-testid="stat-ytd-spend">
          <div className="dash-card-top">
            <div><strong>{money(ytd)}</strong><p>ytd spend<span>·</span>live data</p></div>
            <span className="dash-chip-dark">Year to Date</span>
          </div>
          <Sparkline />
          <div className="dash-card-split">
            <div><small>Year progress</small><strong>{progress}%</strong><div className="dash-bar"><span style={{ width: `${progress}%` }} /></div></div>
            <div><small>Open amount</small><strong>${openAmount}</strong><p><i />{openOrders.length} order{openOrders.length === 1 ? '' : 's'}</p></div>
          </div>
        </article>

        <article className="dash-card" data-testid="stat-balance">
          <div className="dash-card-top">
            <div><strong>{money(openAmount)}</strong><p>outstanding balance<span>·</span>combined</p></div>
          </div>
          <span className="dash-chip tone-green"><CheckCircle2 size={15} /> No past-due balance</span>
          <div className="dash-card-split">
            <div><small>Past due</small><strong>$0</strong><div className="dash-bar"><span style={{ width: '0%' }} /></div></div>
            <div><small>Current</small><strong>${openAmount}</strong><div className="dash-bar"><span style={{ width: '100%' }} /></div></div>
          </div>
        </article>

        <article className="dash-card" data-testid="stat-terms">
          <div className="dash-card-top">
            <div><strong className="dash-strong-sm">50% Prepay, 50% Net 60</strong><p>payment terms<span>·</span>active</p></div>
          </div>
          <span className="dash-chip"><FileText size={15} /> Invoiced account</span>
          <div className="dash-card-split">
            <div><small>Active orders</small><strong>{openOrders.length}</strong><div className="dash-bar"><span style={{ width: `${Math.min(100, openOrders.length * 10)}%` }} /></div></div>
            <div><small>Last order</small><strong>{new Date(`${orders[0].date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong><p><i className="grey" />7d ago</p></div>
          </div>
        </article>
      </div>

      <p className="dash-section-label">Quick actions</p>
      <div className="dash-actions">
        {actions.map(({ label, title, sub, icon: Icon, tone }) => (
          <button key={label} className="dash-action" onClick={() => onNavigate(label)} data-testid={`quick-action-${label.toLowerCase().replace(/\s+/g, '-')}`}>
            <span className={`dash-action-icon tone-${tone}`}><Icon size={22} strokeWidth={1.8} /></span>
            <span className="dash-action-copy"><strong>{title}</strong><small>{sub}</small></span>
            <ArrowUpRight size={17} className="dash-action-arrow" />
          </button>
        ))}
      </div>

      <OrdersTable onViewAll={() => onNavigate('My Orders')} />
    </div>
  );
}
