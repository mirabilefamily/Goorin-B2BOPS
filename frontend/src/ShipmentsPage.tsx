import { useMemo, useState } from 'react';
import { Check, Download, Search, Ship, X } from 'lucide-react';
import { useToast } from '@/lib/toast';
import { money } from '@/lib/money';
import { useBackable } from '@/lib/nav';
import { Detail } from './ShipmentDetail';
import { fmt, shipLines, shipments, shipTotal, stageLabel, stageTone, type Shipment } from './lib/shipments';
import './marketplace.css';
import './dashboard.css';
import './prebook.css';
import './orders.css';
import './shipments.css';

export default function ShipmentsPage() {
  const notify = useToast();
  const [coo, setCoo] = useState(true);
  const [scope, setScope] = useState<'All' | 'Active' | 'Completed'>('All');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Shipment | null>(null);
  useBackable(!!open, () => setOpen(null));
  const list = useMemo(() => { const q = query.trim().toLowerCase(); return shipments.filter((s) => (scope === 'All' || (scope === 'Active' ? s.stage < 5 : s.stage >= 5)) && (!q || s.id.toLowerCase().includes(q) || s.order.id.toLowerCase().includes(q) || s.order.factory.toLowerCase().includes(q))); }, [scope, query]);
  const total = list.reduce((s, x) => s + shipTotal(x), 0);
  if (open) return <Detail s={open} onBack={() => setOpen(null)} coo={coo} setCoo={(v) => { setCoo(v); notify(v ? 'Certificate of Origin now required for new shipments' : 'Certificate of Origin requirement turned off'); }} />;
  return (
    <div className="ord" data-testid="shipments-page">
      <section className="sh-card sh-toggle"><div><strong>Require a Certificate of Origin for every shipment</strong><span>Applies to new international shipments only. Existing shipments are not altered.</span></div><button role="switch" aria-checked={coo} className={`sh-switch ${coo ? 'on' : ''}`} onClick={() => { setCoo(!coo); notify(!coo ? 'Certificate of Origin now required for new shipments' : 'Certificate of Origin requirement turned off'); }} data-testid="coo-toggle"><i /></button></section>
      <div className="ord-bar">
        <div className="dash-segment" role="tablist">{(['All', 'Active', 'Completed'] as const).map((s) => <button key={s} role="tab" aria-selected={scope === s} className={scope === s ? 'active' : ''} onClick={() => setScope(s)} data-testid={`shipments-scope-${s.toLowerCase()}`}>{s === 'All' ? 'All Shipments' : s}<em>{s === 'All' ? shipments.length : shipments.filter((x) => (s === 'Active' ? x.stage < 6 : x.stage >= 6)).length}</em></button>)}</div>
        <button className="mk-btn" onClick={() => { const rows = ['Shipment,SO,Factory,Est ship,Created,Lines,Value,Status', ...list.map((s) => [s.id, s.order.id, s.order.factory, s.order.shipStart, s.created, s.order.lines.length, shipTotal(s).toFixed(2), stageLabel(s)].join(','))]; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' })); a.download = 'goorin-shipments.csv'; a.click(); }} data-testid="shipments-export"><Download /> Export</button>
      </div>
      <section className="dash-orders ord-card">
        <div className="dash-orders-tools ord-tools">
          <label className="dash-search"><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by shipment #, SO, or factory…" data-testid="shipments-search" />{query && <button onClick={() => setQuery('')} aria-label="Clear"><X /></button>}</label>
          <div className="ord-summary"><span data-testid="shipments-count"><strong>{list.length}</strong> shipment{list.length === 1 ? '' : 's'}</span><i /><span>Total <strong>{money(total)}</strong></span></div>
        </div>
        <div className="dash-table-wrap"><table className="dash-table ord-table ord-table--ships">
          <thead><tr><th>Shipment</th><th>SO #(s)</th><th>Factory</th><th>Est. ship date</th><th>Created</th><th>Lines</th><th>Value</th><th>COO</th><th>Status</th><th /></tr></thead>
          <tbody>{list.map((s) => (
            <tr key={s.id} onClick={() => setOpen(s)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpen(s)} data-testid={`shipment-row-${s.id}`}>
              <td><div className="ord-id"><strong>{s.id}</strong><span>{s.transport} · {s.incoterms}</span></div></td><td className="dash-td-id">{s.order.id}</td><td className="muted">{s.order.factory}</td><td>{fmt(s.order.shipStart)}</td><td>{fmt(s.created)}</td><td>{shipLines(s).length}</td><td className="dash-td-total">{money(shipTotal(s))}</td>
              <td>{s.coo ? <span className="dash-pill tone-green"><Check /> On file</span> : <span className="muted">—</span>}</td><td><span className={`dash-pill tone-${stageTone(s)}`}><i />{stageLabel(s)}</span></td><td className="dash-td-chevron"><span className="sh-view">View details</span></td>
            </tr>
          ))}</tbody></table></div>
        {list.length === 0 && <div className="mk-empty ord-empty" data-testid="shipments-empty"><Ship /><strong>No shipments match</strong><span>Try another search or filter.</span><button onClick={() => { setQuery(''); setScope('All'); }}>Clear filters</button></div>}
      </section>
    </div>
  );
}
