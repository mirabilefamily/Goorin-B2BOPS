import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  BookMarked,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Package,
  RotateCcw,
  Search,
  ShoppingBag,
  Truck,
  X,
} from 'lucide-react';
import { useToast } from '@/lib/toast';
import { money } from '@/lib/money';
import { useBackable } from '@/lib/nav';
import './dashboard.css';

type Props = { name: string; onNavigate: (label: string) => void };

type LineItem = { sku: string; name: string; qty: number; price: number };
type Order = {
  id: string;
  date: string;
  shipDate: string;
  estimated: boolean;
  items: number;
  total: number;
  status: 'Open' | 'Shipped' | 'Delivered' | 'Cancelled';
  payment: 'Partially Paid' | 'Not invoiced' | 'Paid' | 'Refunded';
  lines: LineItem[];
  tracking?: string;
};

const lines = (a: number, b: number): LineItem[] => [
  { sku: 'GB-101-BLK', name: 'Heritage Trucker · Black', qty: a, price: 8.5 },
  { sku: 'GB-204-OLV', name: 'Farm Animal Snapback · Olive', qty: b, price: 8.5 },
];

const orders: Order[] = [
  { id: 'SO58739', date: '2026-09-02', shipDate: '2027-01-06', estimated: true, items: 2, total: 17, status: 'Open', payment: 'Not invoiced', lines: lines(1, 1) },
  { id: 'SO57017', date: '2026-08-27', shipDate: '2027-01-06', estimated: true, items: 2, total: 17, status: 'Open', payment: 'Partially Paid', lines: lines(1, 1) },
  { id: 'SO56680', date: '2026-08-25', shipDate: '2026-08-25', estimated: true, items: 2, total: 17, status: 'Open', payment: 'Partially Paid', lines: lines(2, 0), tracking: '1Z 999 AA1 01 2345 6784' },
  { id: 'SO55912', date: '2026-07-14', shipDate: '2026-07-19', estimated: false, items: 24, total: 1128, status: 'Delivered', payment: 'Paid', lines: lines(12, 12), tracking: '1Z 999 AA1 01 2345 1190' },
  { id: 'SO55340', date: '2026-06-03', shipDate: '2026-06-09', estimated: false, items: 12, total: 564, status: 'Delivered', payment: 'Paid', lines: lines(6, 6), tracking: '1Z 999 AA1 01 2345 0871' },
  { id: 'SO54871', date: '2026-04-22', shipDate: '2026-04-28', estimated: false, items: 36, total: 1692, status: 'Shipped', payment: 'Paid', lines: lines(18, 18), tracking: '1Z 999 AA1 01 2344 9902' },
  { id: 'SO54102', date: '2026-03-11', shipDate: '2026-03-15', estimated: false, items: 6, total: 282, status: 'Cancelled', payment: 'Refunded', lines: lines(3, 3) },
  { id: 'SO53559', date: '2026-01-28', shipDate: '2026-02-02', estimated: false, items: 18, total: 846, status: 'Delivered', payment: 'Paid', lines: lines(9, 9), tracking: '1Z 999 AA1 01 2344 5511' },
];

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ytdSpend = [846, 0, 282, 1692, 0, 564, 1128, 34, 17, 0, 0, 0];
const trailingSpend = [420, 610, 380, ...ytdSpend.slice(0, 9)];
const trailingMonths = ['Oct', 'Nov', 'Dec', ...months.slice(0, 9)];

const compact = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`);
const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', opts);

const daysAgo = (iso: string) => {
  const d = Math.max(0, Math.round((Date.now() - new Date(`${iso}T12:00:00`).getTime()) / 86400000));
  return d === 0 ? 'today' : d === 1 ? '1d ago' : `${d}d ago`;
};

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

function SpendBars({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(...values, 1);
  const last = values.length - 1;
  return (
    <div className="stat-visual stat-visual--chart">
      <div className="stat-chart" role="img" aria-label="Monthly spend">
        {values.map((v, i) => (
          <div key={labels[i] + i} className={`stat-bar ${i === last ? 'is-active' : ''}`} data-testid={`spend-bar-${labels[i].toLowerCase()}`}>
            {i === last ? <span className="stat-bar-val" style={{ bottom: `calc(${Math.max(5, (v / max) * 100)}% + 6px)` }}>{compact(v)}</span> : <span className="stat-tip">{labels[i]} · {money(v)}</span>}
            <i style={{ height: `${Math.max(5, (v / max) * 100)}%`, animationDelay: `${0.2 + i * 0.03}s` }} />
          </div>
        ))}
      </div>
      <div className="stat-axis"><span>{labels[0]}</span><span>{labels[Math.floor(labels.length / 2)]}</span><span>{labels[labels.length - 1]}</span></div>
    </div>
  );
}

function AgingStrip({ current }: { current: number }) {
  const buckets = [
    { label: 'Current', amount: current },
    { label: '1–30', amount: 0 },
    { label: '31–60', amount: 0 },
    { label: '60+', amount: 0 },
  ];
  return (
    <div className="stat-visual stat-aging" role="img" aria-label="Receivables aging" data-testid="stat-aging">
      {buckets.map((b, i) => (
        <div key={b.label} className={`stat-aging-b ${b.amount > 0 ? 'has' : ''} ${i >= 2 ? 'late' : ''}`}>
          <i />
          <small>{b.label}</small>
          <strong>{b.amount > 0 ? money(b.amount) : '—'}</strong>
        </div>
      ))}
    </div>
  );
}

function TermsTimeline({ open }: { open: number }) {
  const half = open / 2;
  const steps = [
    { label: 'Order placed', sub: `50% · ${money(half)}`, state: 'done' },
    { label: 'Ships', sub: 'Invoice issued', state: 'next' },
    { label: 'Net 60 due', sub: `50% · ${money(half)}`, state: '' },
  ];
  return (
    <ol className="stat-visual stat-timeline" aria-label="Payment schedule" data-testid="stat-terms-timeline">
      {steps.map((st) => (
        <li key={st.label} className={st.state}><i /><span><strong>{st.label}</strong><small>{st.sub}</small></span></li>
      ))}
    </ol>
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

function OrderDrawer({ order, onClose, onNavigate }: { order: Order; onClose: () => void; onNavigate: (l: string) => void }) {
  const notify = useToast();
  const stageIdx = { Open: 1, Shipped: 2, Delivered: 3, Cancelled: 0 }[order.status];
  const stages = ['Placed', 'Confirmed', 'Shipped', 'Delivered'];
  const subtotal = order.lines.reduce((s, l) => s + l.qty * l.price, 0);
  const paid = order.payment === 'Paid' ? order.total : order.payment === 'Partially Paid' ? order.total / 2 : 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div className="dash-drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="dash-drawer" role="dialog" aria-label={`Order ${order.id}`} data-testid="order-drawer">
        <header className="dash-drawer-head">
          <div>
            <p className="dash-eyebrow">Order detail</p>
            <h2>{order.id}</h2>
            <span>Placed {fmtDate(order.date)} · {order.items} units</span>
          </div>
          <button className="dash-drawer-close" onClick={onClose} aria-label="Close" data-testid="order-drawer-close"><X size={18} /></button>
        </header>

        <div className="dash-drawer-pills">
          <span className={`dash-pill tone-${statusTone[order.status]}`}><i />{order.status}</span>
          <span className={`dash-pill tone-${paymentTone[order.payment]}`}>{order.payment}</span>
        </div>

        <section className="dash-drawer-section">
          <h3>Shipment timeline</h3>
          <ol className={`dash-timeline ${order.status === 'Cancelled' ? 'is-cancelled' : ''}`}>
            {stages.map((s, i) => (
              <li key={s} className={i < stageIdx + 1 ? 'done' : ''} data-testid={`timeline-${s.toLowerCase()}`}>
                <i />
                <strong>{order.status === 'Cancelled' && i === 0 ? 'Cancelled' : s}</strong>
                <small>{i === 0 ? fmtDate(order.date) : i === 2 || i === 3 ? (order.estimated ? `Est. ${fmtDate(order.shipDate)}` : fmtDate(order.shipDate)) : fmtDate(order.date)}</small>
              </li>
            ))}
          </ol>
          {order.tracking && <div className="dash-tracking"><Truck size={15} /><span>{order.tracking}</span><em>UPS Ground</em></div>}
        </section>

        <section className="dash-drawer-section">
          <h3>Line items</h3>
          <ul className="dash-lines">
            {order.lines.filter((l) => l.qty > 0).map((l) => (
              <li key={l.sku}>
                <span className="dash-line-thumb" />
                <div><strong>{l.name}</strong><small>{l.sku} · {l.qty} × {money(l.price)}</small></div>
                <b>{money(l.qty * l.price)}</b>
              </li>
            ))}
          </ul>
          <dl className="dash-totals">
            <div><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
            <div><dt>Shipping</dt><dd>Included</dd></div>
            <div><dt>Paid to date</dt><dd>{money(paid)}</dd></div>
            <div className="grand"><dt>Balance due</dt><dd>{money(Math.max(0, order.total - paid))}</dd></div>
          </dl>
        </section>

        <footer className="dash-drawer-foot">
          <button className="dash-btn-primary" onClick={() => { notify(`${order.items} units from ${order.id} added to your cart.`); onNavigate('Marketplace'); }} data-testid="order-reorder-btn"><RotateCcw size={16} /> Reorder</button>
          <button className="dash-btn-secondary" onClick={() => notify(order.payment === 'Not invoiced' ? 'No invoice has been issued for this order yet.' : `Invoice for ${order.id} downloading…`, order.payment === 'Not invoiced' ? 'info' : 'success')} data-testid="order-invoice-btn"><Download size={16} /> Invoice</button>
        </footer>
      </aside>
    </>
  );
}

function OrdersTable({ onViewAll, onOpen }: { onViewAll: () => void; onOpen: (o: Order) => void }) {
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
    <section className="dash-orders dash-reveal" style={{ animationDelay: '.3s' }} data-testid="recent-orders-card">
      <div className="dash-orders-head">
        <div><h2>{scope === 'recent' ? 'Recent Orders' : 'All Orders'}</h2><p>{scope === 'recent' ? 'Your latest purchase history · click a row for details' : 'Every order placed on this account'}</p></div>
        <div className="dash-segment" role="tablist">
          <button role="tab" aria-selected={scope === 'recent'} className={scope === 'recent' ? 'active' : ''} onClick={() => setScope('recent')} data-testid="orders-scope-recent">Recent</button>
          <button role="tab" aria-selected={scope === 'all'} className={scope === 'all' ? 'active' : ''} onClick={() => setScope('all')} data-testid="orders-scope-all">All Orders</button>
        </div>
      </div>
      <div className="dash-orders-tools">
        <label className="dash-search"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by order # or status..." data-testid="orders-search-input" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search" data-testid="orders-search-clear"><X size={15} /></button>}</label>
        <button className="dash-export" onClick={exportCsv} data-testid="orders-export-btn"><Download size={16} /> Export</button>
      </div>
      <div className="dash-table-wrap">
        <table className="dash-table dash-table--orders">
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
              <tr key={o.id} onClick={() => onOpen(o)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen(o)} data-testid={`order-row-${o.id}`}>
                <td className="dash-td-id">{o.id}</td>
                <td>{fmtDate(o.date)}</td>
                <td>{o.estimated ? `Est. ${fmtDate(o.shipDate)}` : fmtDate(o.shipDate)}</td>
                <td>{o.items} units</td>
                <td className="dash-td-total">{money(o.total)}</td>
                <td><span className={`dash-pill tone-${statusTone[o.status]}`}><i />{o.status}</span><span className={`dash-pill tone-${paymentTone[o.payment]}`}>{o.payment}</span></td>
                <td className="dash-td-chevron"><ChevronRight size={17} /></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="dash-empty" data-testid="orders-empty">
                <Search size={22} /><strong>No orders match “{query}”</strong><span>Try an order number like SO58739, or a status such as “paid” or “open”.</span>
                <button onClick={() => setQuery('')}>Clear search</button>
              </td></tr>
            )}
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

function Skeleton() {
  return (
    <div className="dash dash-skeleton" aria-busy="true" data-testid="dashboard-skeleton">
      <div className="sk sk-hero" />
      <div className="stat-grid"><div className="sk sk-card" /><div className="sk sk-card" /><div className="sk sk-card" /></div>
      <div className="qa-grid" style={{ marginTop: 36 }}><div className="sk sk-action" /><div className="sk sk-action" /><div className="sk sk-action" /><div className="sk sk-action" /></div>
    </div>
  );
}

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

export default function DashboardPage({ name, onNavigate }: Props) {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'ytd' | 'trailing'>('ytd');
  const [selected, setSelected] = useState<Order | null>(null);
  useBackable(!!selected, () => setSelected(null));

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 550);
    return () => clearTimeout(t);
  }, []);

  const progress = yearProgress();
  const openOrders = orders.filter((o) => o.status === 'Open');
  const openAmount = openOrders.reduce((s, o) => s + o.total, 0);
  const spendValues = range === 'ytd' ? ytdSpend.slice(0, 9) : trailingSpend;
  const spendLabels = range === 'ytd' ? months.slice(0, 9) : trailingMonths;
  const spendTotal = spendValues.reduce((s, v) => s + v, 0);
  const spendShown = useCountUp(spendTotal);
  const lastYear = range === 'ytd' ? 3860 : 5120;
  const delta = Math.round(((spendTotal - lastYear) / lastYear) * 100);
  const balanceShown = useCountUp(openAmount);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const actions = [
    { label: 'Marketplace', title: 'Browse Catalog', sub: 'Shop current in-stock styles at wholesale pricing.', cta: 'Shop now', icon: ShoppingBag },
    { label: 'Pre-Book', title: 'Pre-Book Orders', sub: 'Plan and reserve upcoming seasonal releases.', cta: 'View pre-books', icon: BookOpen },
    { label: 'My Orders', title: 'Track Orders', sub: `${openOrders.length} open order${openOrders.length === 1 ? '' : 's'} currently in fulfillment.`, cta: 'Track orders', icon: Package },
    { label: 'Resources', title: 'Brand Assets', sub: 'Download line sheets, imagery and brand media.', cta: 'Resources', icon: BookMarked },
  ];

  if (loading) return <Skeleton />;

  return (
    <div className="dash" data-testid="dashboard-page">
      <header className="dash-hero dash-reveal">
        <div>
          <p className="dash-eyebrow"><i />The Goorin Bros. B2B Portal</p>
          <h1 data-testid="dashboard-greeting">{greeting()}, <em>{name}</em>.</h1>
          <p className="dash-sub">Here's a snapshot of Mirabile Distribution's account.</p>
        </div>
        <div className="dash-hero-meta">
          <span className="dash-date"><CalendarDays />{today}</span>
        </div>
      </header>

      <div className="stat-grid">
        <article className="stat stat--dark dash-reveal" style={{ animationDelay: '.1s' }} data-testid="stat-ytd-spend">
          <div className="stat-head">
            <span className="stat-label">{range === 'ytd' ? 'YTD spend' : 'Trailing 12-month spend'}</span>
            <button className="stat-toggle" onClick={() => setRange(range === 'ytd' ? 'trailing' : 'ytd')} data-testid="spend-range-toggle">{range === 'ytd' ? 'Year to Date' : 'Last 12 months'}<ArrowUpDown /></button>
          </div>
          <div className="stat-value-row"><strong className="stat-value">{money(spendShown)}</strong><span className={`stat-delta ${delta >= 0 ? 'up' : 'down'}`} data-testid="spend-delta">{delta >= 0 ? <ArrowUp /> : <ArrowDown />}{Math.abs(delta)}% vs LY</span></div>
          <SpendBars values={spendValues} labels={spendLabels} />
          <dl className="stat-meta">
            <div><dt>Year progress</dt><dd>{progress}%</dd></div>
            <div><dt>Open amount</dt><dd>{money(openAmount)} <span className="muted">· {openOrders.length} order{openOrders.length === 1 ? '' : 's'}</span></dd></div>
          </dl>
        </article>

        <article className="stat dash-reveal" style={{ animationDelay: '.16s' }} data-testid="stat-balance">
          <div className="stat-head">
            <span className="stat-label">Outstanding balance</span>
            <span className="stat-chip stat-chip--good"><CheckCircle2 /> No past-due balance</span>
          </div>
          <strong className="stat-value">{money(balanceShown)}</strong>
          <p className="stat-note">Across {openOrders.length} open orders — nothing is overdue.</p>
          <AgingStrip current={openAmount} />
          <dl className="stat-meta">
            <div><dt>Past due</dt><dd>$0.00</dd></div>
            <div><dt>Credit available</dt><dd>{money(5000 - openAmount)} <span className="muted">of $5,000</span></dd></div>
          </dl>
        </article>

        <article className="stat dash-reveal" style={{ animationDelay: '.22s' }} data-testid="stat-terms">
          <div className="stat-head">
            <span className="stat-label">Payment terms</span>
            <span className="stat-chip"><FileText /> Invoiced account</span>
          </div>
          <strong className="stat-value stat-value--terms"><span>50%</span><small>Prepay</small><em>/</em><span>50%</span><small>Net 60</small></strong>
          <p className="stat-note">Half due at order, half invoiced 60 days after shipment.</p>
          <TermsTimeline open={openAmount} />
          <dl className="stat-meta">
            <div><dt>Active orders</dt><dd>{openOrders.length} <span className="muted">open</span></dd></div>
            <div><dt>Last order placed</dt><dd>{fmtDate(orders[0].date, { month: 'short', day: 'numeric' })} <span className="muted">· {daysAgo(orders[0].date)}</span></dd></div>
          </dl>
        </article>
      </div>

      <div className="qa-head dash-reveal" style={{ animationDelay: '.26s' }}><h2>Quick actions</h2><span>Jump back in</span></div>
      <div className="qa-grid">
        {actions.map(({ label, title, sub, cta, icon: Icon }, i) => (
          <button key={label} className="qa dash-reveal" style={{ animationDelay: `${0.28 + i * 0.04}s` }} onClick={() => onNavigate(label)} data-testid={`quick-action-${label.toLowerCase().replace(/\s+/g, '-')}`}>
            <span className="qa-icon"><Icon strokeWidth={1.8} /></span>
            <span className="qa-copy-wrap"><strong>{title}</strong><small>{sub}</small></span>
            <span className="qa-cta">{cta} <ArrowUpRight /></span>
          </button>
        ))}
      </div>

      <OrdersTable onViewAll={() => onNavigate('My Orders')} onOpen={setSelected} />

      {selected && <OrderDrawer order={selected} onClose={() => setSelected(null)} onNavigate={(l) => { setSelected(null); onNavigate(l); }} />}
    </div>
  );
}
