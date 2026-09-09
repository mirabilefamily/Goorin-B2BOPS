import { useMemo, useState } from 'react';
import { ArrowLeft, Check, CheckCircle2, Download, FileText, Lock, MessageSquare, Search, Send, Ship, X } from 'lucide-react';
import { useToast } from '@/lib/toast';
import { money } from '@/lib/money';
import { orders, orderTotal, orderUnits, type Order } from '@/lib/orders';
import './marketplace.css';
import './dashboard.css';
import './prebook.css';
import './orders.css';
import './shipments.css';

type Shipment = { id: string; order: Order; created: string; stage: number; coo: boolean; incoterms: string; transport: string; forwarder: string; prepaidAt: string };
const stages = ['Draft', 'Ready', 'Shipping Instructions', 'Pre-payment', 'Released', 'Shipped', 'Invoiced'];
const shipments: Shipment[] = orders.filter((o) => o.shipment).map((o) => ({
  id: o.shipment!, order: o, created: o.date, coo: o.status !== 'Open',
  stage: o.status === 'Open' ? 4 : o.status === 'Shipped' ? 5 : 6,
  incoterms: 'FOB', transport: 'Ocean', forwarder: 'FF 123', prepaidAt: `${o.date} 12:49 AM`,
}));
const fmt = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const stageLabel = (s: Shipment) => (s.stage >= 6 ? 'Invoiced' : s.stage === 5 ? 'Shipped' : 'Prepaid');
const stageTone = (s: Shipment) => (s.stage >= 6 ? 'green' : s.stage === 5 ? 'teal' : 'blue');

function Detail({ s, onBack, coo, setCoo }: { s: Shipment; onBack: () => void; coo: boolean; setCoo: (v: boolean) => void }) {
  const notify = useToast();
  const [msgs, setMsgs] = useState<{ who: string; text: string; at: string }[]>([]);
  const [draft, setDraft] = useState('');
  const send = () => { if (!draft.trim()) return; setMsgs((m) => [...m, { who: 'Ryan M', text: draft.trim(), at: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) }]); setDraft(''); };
  const total = orderTotal(s.order);
  return (
    <div className="sh" data-testid="shipment-detail">
      <div className="sh-head">
        <button className="pb-back" onClick={onBack} data-testid="shipment-back"><ArrowLeft /> Shipments</button>
        <span className="sh-title"><Ship /> {s.id}</span>
        <span className={`dash-pill tone-${stageTone(s)}`}><i />{stageLabel(s)}</span>
      </div>
      <ol className="sh-stages" data-testid="shipment-stages">{stages.map((st, i) => <li key={st} className={i < s.stage ? 'done' : i === s.stage ? 'current' : ''}><i />{st}</li>)}</ol>

      <section className="sh-card">
        <header><div><h2>Complete both requirements</h2><p>Complete payment and shipping instructions in either order.</p></div><span className="stat-chip stat-chip--good">2 of 2 complete</span></header>
        <div className="sh-reqs">
          <div className="sh-req done"><CheckCircle2 /><div><strong>Requirement 1: Payment</strong><span>Payment requirement complete</span></div></div>
          <div className="sh-req done"><CheckCircle2 /><div><strong>Requirement 2: Shipping instructions</strong><span>Shipping instructions complete</span></div></div>
        </div>
        <p className="sh-lock"><Lock /> Both requirements are complete. Payment and shipping instructions are now locked.</p>
      </section>
      <div className="co-reserve sh-ok"><CheckCircle2 /> Prepayment received {fmt(s.created)}, 12:49 AM. Your shipment is being prepared for release to the factory.</div>

      <div className="sh-grid">
        <div className="sh-col">
          <section className="sh-card"><dl className="sh-facts"><div><dt>Factory</dt><dd>{s.order.factory}</dd></div><div><dt>Created</dt><dd>{fmt(s.created)}</dd></div><div><dt>Incoterms</dt><dd>{s.incoterms}</dd></div><div><dt>Declared value</dt><dd>{money(total)}</dd></div></dl></section>
          <section className="sh-card"><h3>Documents</h3>
            {['Packing List', 'Commercial Invoice', ...(coo ? ['Certificate of Origin'] : [])].map((d) => <button key={d} className="sh-doc" onClick={() => notify(`${d}.pdf downloading…`)} data-testid={`doc-${d.toLowerCase().replace(/\s+/g, '-')}`}><FileText /><span>{d} (PDF)</span><Download /></button>)}
          </section>
          <section className="sh-card"><h3>Requirement 2: Shipping instructions</h3>
            <dl className="sh-facts"><div className="full"><dt>Booking method</dt><dd>Freight forwarder</dd></div><div className="full"><dt>{s.forwarder}</dt><dd className="muted">Name · name@ff123.com · 3213444590 · USA</dd></div><div><dt>Transport</dt><dd>{s.transport}</dd></div><div><dt>Submitted</dt><dd>{fmt(s.created)}, 12:48 AM</dd></div></dl>
            <div className="sh-upload" onClick={() => notify('Upload carrier labels (PDF, PNG, JPEG)', 'info')} data-testid="shipment-upload"><strong>Shipping labels &amp; documents</strong><span>Upload carrier labels or other shipping documents for the factory. PDF, PNG, and JPEG files are supported.</span></div>
          </section>
          <section className="sh-card sh-toggle"><div><strong>Require a Certificate of Origin for every shipment</strong><span>Applies to new international shipments only. Existing shipments are not altered.</span></div><button role="switch" aria-checked={coo} className={`sh-switch ${coo ? 'on' : ''}`} onClick={() => setCoo(!coo)} data-testid="coo-toggle-detail"><i /></button></section>
        </div>
        <div className="sh-col">
          <section className="od-lines"><header><h2>Line items <span>· {s.id}</span></h2><span>{s.order.lines.length} lines · {orderUnits(s.order)} units</span></header>
            <div className="dash-table-wrap"><table className="dash-table od-table"><thead><tr><th>SKU</th><th>Product</th><th>Shipment</th><th>Order</th><th>Qty</th><th>Unit value</th><th className="r">Amount</th></tr></thead>
              <tbody>{s.order.lines.map((l) => <tr key={l.sku}><td className="mono">{l.sku}</td><td className="dash-td-id">{l.name}</td><td>{s.id}</td><td>{s.order.id}</td><td>{l.qty}</td><td>{money(l.price)}</td><td className="dash-td-total r">{money(l.qty * l.price)}</td></tr>)}</tbody></table></div>
          </section>
          <section className="sh-card sh-chat" data-testid="shipment-chat">
            <header><MessageSquare /><div><h2>Shipment conversation</h2><p>Replies notify the Goorin Bros. team according to their notification settings.</p></div></header>
            <div className="sh-msgs">
              {msgs.length === 0 ? <div className="sh-empty"><MessageSquare /><strong>No messages yet</strong><span>Start the conversation here. Every reply will show who sent it and when.</span></div>
                : msgs.map((m, i) => <div key={i} className="sh-msg" data-testid={`chat-msg-${i}`}><b>{m.who}</b><span>{m.at}</span><p>{m.text}</p></div>)}
            </div>
            <div className="sh-compose"><textarea value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Write a message..." data-testid="chat-input" /><button className="co-primary" onClick={send} disabled={!draft.trim()} data-testid="chat-send"><Send /> Send</button></div>
            <small>Enter to send · Shift + Enter for a new line</small>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function ShipmentsPage() {
  const notify = useToast();
  const [coo, setCoo] = useState(true);
  const [scope, setScope] = useState<'All' | 'Active' | 'Completed'>('All');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Shipment | null>(null);
  const list = useMemo(() => { const q = query.trim().toLowerCase(); return shipments.filter((s) => (scope === 'All' || (scope === 'Active' ? s.stage < 6 : s.stage >= 6)) && (!q || s.id.toLowerCase().includes(q) || s.order.id.toLowerCase().includes(q) || s.order.factory.toLowerCase().includes(q))); }, [scope, query]);
  const total = list.reduce((s, x) => s + orderTotal(x.order), 0);
  if (open) return <Detail s={open} onBack={() => setOpen(null)} coo={coo} setCoo={(v) => { setCoo(v); notify(v ? 'Certificate of Origin now required for new shipments' : 'Certificate of Origin requirement turned off'); }} />;
  return (
    <div className="ord" data-testid="shipments-page">
      <section className="sh-card sh-toggle"><div><strong>Require a Certificate of Origin for every shipment</strong><span>Applies to new international shipments only. Existing shipments are not altered.</span></div><button role="switch" aria-checked={coo} className={`sh-switch ${coo ? 'on' : ''}`} onClick={() => { setCoo(!coo); notify(!coo ? 'Certificate of Origin now required for new shipments' : 'Certificate of Origin requirement turned off'); }} data-testid="coo-toggle"><i /></button></section>
      <div className="ord-bar">
        <div className="dash-segment" role="tablist">{(['All', 'Active', 'Completed'] as const).map((s) => <button key={s} role="tab" aria-selected={scope === s} className={scope === s ? 'active' : ''} onClick={() => setScope(s)} data-testid={`shipments-scope-${s.toLowerCase()}`}>{s === 'All' ? 'All Shipments' : s}<em>{s === 'All' ? shipments.length : shipments.filter((x) => (s === 'Active' ? x.stage < 6 : x.stage >= 6)).length}</em></button>)}</div>
        <button className="mk-btn" onClick={() => { const rows = ['Shipment,SO,Factory,Est ship,Created,Lines,Value,Status', ...list.map((s) => [s.id, s.order.id, s.order.factory, s.order.shipStart, s.created, s.order.lines.length, orderTotal(s.order).toFixed(2), stageLabel(s)].join(','))]; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' })); a.download = 'goorin-shipments.csv'; a.click(); }} data-testid="shipments-export"><Download /> Export</button>
      </div>
      <section className="dash-orders ord-card">
        <div className="dash-orders-tools ord-tools">
          <label className="dash-search"><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by shipment #, SO, or factory…" data-testid="shipments-search" />{query && <button onClick={() => setQuery('')} aria-label="Clear"><X /></button>}</label>
          <div className="ord-summary"><span data-testid="shipments-count"><strong>{list.length}</strong> shipment{list.length === 1 ? '' : 's'}</span><i /><span>Total <strong>{money(total)}</strong></span></div>
        </div>
        <div className="dash-table-wrap"><table className="dash-table ord-table">
          <thead><tr><th>Shipment</th><th>SO #(s)</th><th>Factory</th><th>Est. ship date</th><th>Created</th><th>Lines</th><th>Value</th><th>COO</th><th>Status</th><th /></tr></thead>
          <tbody>{list.map((s) => (
            <tr key={s.id} onClick={() => setOpen(s)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpen(s)} data-testid={`shipment-row-${s.id}`}>
              <td><div className="ord-id"><strong>{s.id}</strong><span>{s.transport} · {s.incoterms}</span></div></td><td className="dash-td-id">{s.order.id}</td><td className="muted">{s.order.factory}</td><td>{fmt(s.order.shipStart)}</td><td>{fmt(s.created)}</td><td>{s.order.lines.length}</td><td className="dash-td-total">{money(orderTotal(s.order))}</td>
              <td>{s.coo ? <span className="dash-pill tone-green"><Check /> On file</span> : <span className="muted">—</span>}</td><td><span className={`dash-pill tone-${stageTone(s)}`}><i />{stageLabel(s)}</span></td><td className="dash-td-chevron"><span className="sh-view">View</span></td>
            </tr>
          ))}</tbody></table></div>
        {list.length === 0 && <div className="mk-empty ord-empty" data-testid="shipments-empty"><Ship /><strong>No shipments match</strong><span>Try another search or filter.</span><button onClick={() => { setQuery(''); setScope('All'); }}>Clear filters</button></div>}
      </section>
    </div>
  );
}
