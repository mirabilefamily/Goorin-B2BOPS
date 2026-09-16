import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ArrowLeft, Check, CheckCircle2, CreditCard, Download, FileText, LayoutGrid, Lock, MessageSquare, Package, Pencil, Search, Send, Ship, Truck, Upload, X } from 'lucide-react';
import { useToast } from '@/lib/toast';
import { money } from '@/lib/money';
import { CountrySelect } from './CountrySelect';
import { fmt, shipLines, shipTotal, shipUnits, stageLabel, stageTone, stages, type Shipment } from './lib/shipments';

type Tab = 'overview' | 'booking' | 'conversation' | 'documents' | 'activity';
type Msg = { who: string; mine: boolean; text: string; at: string };
type Event = { title: string; detail: string; at: string; by: string; kind: 'message' | 'release' | 'payment' | 'booking' | 'created' };
const stamp = () => new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const seedMsgs = (s: Shipment): Msg[] => [
  { who: 'Goorin Ops', mine: false, text: `Booking confirmed with ${s.forwarder} — ${s.transport.toLowerCase()}, ETD ${fmt(s.order.shipStart)}.`, at: `${fmt(s.created)}, 9:27 PM` },
  { who: 'Ryan M', mine: true, text: 'Great — packing list is final on our side. Releasing to factory once prepayment clears.', at: `${fmt(s.created)}, 9:31 PM` },
  { who: 'Goorin Ops', mine: false, text: 'Prepayment received. Factory has been released.', at: `${fmt(s.created)}, 12:49 AM` },
];
const daysUntil = (iso: string) => Math.max(0, Math.round((new Date(`${iso}T12:00:00`).getTime() - Date.now()) / 86400000));
const initials = (name: string) => name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const eventIcon = { message: MessageSquare, release: Package, payment: CreditCard, booking: Truck, created: Ship };
const docMeta: Record<string, { size: string; note: string }> = { 'Packing List': { size: '184 KB', note: 'Generated from factory packing list' }, 'Commercial Invoice': { size: '96 KB', note: 'Declared value · FOB' }, 'Certificate of Origin': { size: '72 KB', note: 'Issued by factory chamber' } };

export function Detail({ s, onBack, coo, setCoo }: { s: Shipment; onBack: () => void; coo: boolean; setCoo: (v: boolean) => void }) {
  const notify = useToast();
  const [tab, setTab] = useState<Tab>('overview');
  const [msgs, setMsgs] = useState<Msg[]>(() => seedMsgs(s));
  const [draft, setDraft] = useState('');
  const [si, setSi] = useState({ method: 'Freight forwarder' as 'Freight forwarder' | 'Customer pickup', forwarder: s.forwarder, contact: 'Name', email: 'name@ff123.com', phone: '3213444590', country: 'United States', transport: s.transport, notes: '' });
  const [form, setForm] = useState(si);
  const [edit, setEdit] = useState(false);
  const [docs, setDocs] = useState<string[]>([]);
  const [lineQ, setLineQ] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (tab === 'conversation') endRef.current?.scrollIntoView({ block: 'nearest' }); }, [tab, msgs.length]);
  const pickDocs = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.multiple = true; inp.accept = '.pdf,.png,.jpg,.jpeg'; inp.onchange = () => { const names = Array.from(inp.files ?? []).map((f) => f.name); if (names.length) { setDocs((d) => [...names, ...d]); notify(`${names.length} document${names.length === 1 ? '' : 's'} uploaded`); } }; inp.click(); };
  const send = () => { if (!draft.trim()) return; setMsgs((m) => [...m, { who: 'Ryan M', mine: true, text: draft.trim(), at: stamp() }]); setDraft(''); };
  const lines = shipLines(s);
  const shown = useMemo(() => { const q = lineQ.trim().toLowerCase(); return q ? lines.filter((l) => l.sku.toLowerCase().includes(q) || l.name.toLowerCase().includes(q)) : lines; }, [lines, lineQ]);
  const total = shipTotal(s);
  const units = shipUnits(s);
  const prepay = total / 2;
  const eta = fmt(s.order.shipStart);
  const days = daysUntil(s.order.shipStart);
  const generated = ['Packing List', 'Commercial Invoice', ...(coo ? ['Certificate of Origin'] : [])];
  const activity: Event[] = [
    { title: 'Message sent to Goorin', detail: 'Packing list confirmed as final.', at: `${fmt(s.created)}, 3:29 AM`, by: 'Ryan M', kind: 'message' },
    { title: 'Released to factory', detail: 'All release requirements met · production handoff confirmed.', at: `${fmt(s.created)}, 12:50 AM`, by: 'Goorin Ops', kind: 'release' },
    { title: 'Prepayment received', detail: `${money(prepay)} · Visa •••• 4242`, at: `${fmt(s.created)}, 12:49 AM`, by: 'Stripe', kind: 'payment' },
    { title: 'Shipping instructions submitted', detail: `${si.method} · ${si.transport} · ${si.forwarder}`, at: `${fmt(s.created)}, 12:48 AM`, by: 'Ryan M', kind: 'booking' },
    { title: 'Shipment created', detail: `${lines.length} lines · ${units.toLocaleString()} units from ${s.order.id}`, at: `${fmt(s.created)}, 12:40 AM`, by: 'Goorin Ops', kind: 'created' },
  ];
  const nextStep = s.stage >= 6 ? null : stages[s.stage + 1];
  const nextHint: Record<string, string> = { Shipped: 'Goorin will confirm once the factory hands off to your forwarder.', Invoiced: 'Your final invoice is issued after the shipment leaves the factory.', Released: 'Factory release follows once prepayment and shipping instructions are complete.' };
  const tabs: { id: Tab; label: string; icon: typeof LayoutGrid; n?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid }, { id: 'booking', label: 'Booking & payment', icon: Truck }, { id: 'conversation', label: 'Conversation', icon: MessageSquare, n: msgs.length },
    { id: 'documents', label: 'Documents', icon: FileText, n: generated.length }, { id: 'activity', label: 'Activity', icon: Activity, n: activity.length },
  ];
  const dl = (name: string) => notify(`${name} downloading…`);
  const progress = Math.round(((s.stage + 1) / stages.length) * 100);

  return (
    <div className="sh sh--v3" data-testid="shipment-detail">
      <div className="sh-head"><button className="pb-back pb-back--pill" onClick={onBack} data-testid="shipment-back"><ArrowLeft /> Shipments</button></div>

      <section className="sh3-hero" data-testid="shipment-hero">
        <div className="sh3-hero-top">
          <div className="sh3-id">
            <p className="pb-eyebrow">International shipment · {s.order.id}</p>
            <h1>{s.id} <span className={`dash-pill tone-${stageTone(s)}`}><i />{stageLabel(s)}</span></h1>
            <p className="sh3-hero-sub"><Ship /> {s.order.factory} <em>·</em> Created {fmt(s.created)} <em>·</em> {s.transport} · {s.incoterms}</p>
          </div>
          <div className="sh3-hero-actions">
            <button className="co-secondary sh3-btn" onClick={() => setTab('conversation')} data-testid="hero-message"><MessageSquare /> Message Goorin</button>
            <button className="co-primary sh3-btn" onClick={() => notify(`${generated.length} documents downloading…`)} data-testid="hero-download"><Download /> Download documents</button>
          </div>
        </div>
        <dl className="sh3-facts">
          <div><dt>{s.order.estimated ? 'Est. ship date' : 'Ship date'}</dt><dd>{eta}</dd>{s.stage < 5 && <small data-testid="ships-in">in {days} days</small>}</div>
          <div><dt>Mode</dt><dd>{si.transport}</dd><small>{si.method === 'Freight forwarder' ? si.forwarder : 'Customer pickup'}</small></div>
          <div><dt>Incoterms</dt><dd>{s.incoterms} · USD</dd><small>Factory port</small></div>
          <div><dt>Units</dt><dd>{units.toLocaleString()}</dd><small>{lines.length} lines</small></div>
          <div><dt>Declared value</dt><dd>{money(total)}</dd><small>Commercial invoice</small></div>
          <div><dt>Prepayment</dt><dd className="good">{money(prepay)}</dd><small className="good">Received · 50%</small></div>
        </dl>
        <div className="sh3-rail">
          <ol className="sh3-steps" data-testid="shipment-stages">
            {stages.map((st, i) => { const state = i < s.stage ? 'done' : i === s.stage ? 'current' : ''; return (
              <li key={st} className={state}><i>{i < s.stage ? <Check /> : i + 1}</i><strong>{st}</strong><small>{i < s.stage ? 'Done' : i === s.stage ? 'In progress' : 'Upcoming'}</small></li>
            ); })}
          </ol>
          <div className="sh3-rail-foot"><span className="sh3-rail-meta" data-testid="stage-meta">Stage {s.stage + 1} of {stages.length} · {progress}%</span>{nextStep && <p className="sh3-next" data-testid="next-step"><span>Next</span><strong>{nextStep}</strong>{nextHint[nextStep] ?? 'We will keep you posted here.'}</p>}</div>
        </div>
      </section>

      <nav className="sh3-tabs" role="tablist" data-testid="shipment-tabs">
        {tabs.map((t) => { const Icon = t.icon; return <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)} data-testid={`tab-${t.id}`}><Icon />{t.label}{t.n !== undefined && <em>{t.n}</em>}</button>; })}
      </nav>

      {tab === 'overview' && (
        <div className="sh3-grid" data-testid="tab-panel-overview">
          <div className="sh-col">
            <section className="sh-card sh-checklist" data-testid="shipment-requirements">
              <header><div><h2>Release requirements</h2><p>Both must be complete before the factory releases the shipment.</p></div><span className="stat-chip stat-chip--good"><CheckCircle2 /> 2 of 2 complete</span></header>
              <ul className="sh-checks">
                <li className="done"><i><Check /></i><div><strong>Payment</strong><span>Prepayment received {fmt(s.created)}, 12:49 AM</span></div><em>Complete</em></li>
                <li className="done"><i><Check /></i><div><strong>Shipping instructions</strong><span>{si.method} · {si.transport}{si.method === 'Freight forwarder' ? ` · ${si.forwarder}` : ''}</span></div><em>Complete</em></li>
              </ul>
              <p className="sh-lock"><Lock /> Requirements are locked. Your shipment is being prepared for release to the factory.</p>
            </section>
            <section className="sh-card sh3-lines" data-testid="shipment-lines">
              <header><div><h2>Shipment lines</h2><p>From factory packing list · read-only</p></div>
                <label className="dash-search sh3-linesearch"><Search /><input value={lineQ} onChange={(e) => setLineQ(e.target.value)} placeholder="Filter SKU or style…" data-testid="lines-search" />{lineQ && <button onClick={() => setLineQ('')} aria-label="Clear"><X /></button>}</label>
              </header>
              <div className="dash-table-wrap sh-lines-scroll" data-testid="shipment-lines-scroll"><table className="dash-table od-table sh3-table"><thead><tr><th>SKU</th><th>SO #</th><th>Description</th><th className="r">Qty</th><th className="r">Unit value</th><th className="r">Amount</th></tr></thead>
                <tbody>{shown.map((l, i) => <tr key={l.sku + i}><td className="mono">{l.sku}</td><td className="dash-td-id">{s.order.id}</td><td>{l.name}</td><td className="r">{l.qty}</td><td className="r">{money(l.price)}</td><td className="r dash-td-total">{money(l.qty * l.price)}</td></tr>)}</tbody>
                <tfoot><tr><td colSpan={3}>{lineQ ? `${shown.length} of ${lines.length} lines` : `Total · ${lines.length} lines`}</td><td className="r">{shown.reduce((t, l) => t + l.qty, 0).toLocaleString()}</td><td /><td className="dash-td-total r" data-testid="shipment-subtotal">{money(shown.reduce((t, l) => t + l.qty * l.price, 0))}</td></tr></tfoot></table></div>
              {shown.length === 0 && <div className="sh3-nolines" data-testid="lines-empty">No lines match “{lineQ}”.</div>}
            </section>
          </div>
          <aside className="sh-col">
            <section className="sh-card sh3-side" data-testid="shipment-quick-docs">
              <header><h2>Documents</h2><button className="dash-link" onClick={() => setTab('documents')} data-testid="docs-view-all">View all</button></header>
              <ul className="sh3-files">{generated.map((d) => <li key={d}><button className="sh3-file" onClick={() => dl(`${d}.pdf`)} data-testid={`overview-doc-${d.toLowerCase().replace(/\s+/g, '-')}`}><i><FileText /></i><span><b>{d}</b><small>PDF · {docMeta[d].size}</small></span><Download /></button></li>)}</ul>
            </section>
            <section className="sh-card sh3-side" data-testid="shipment-recent-activity">
              <header><h2>Recent activity</h2><button className="dash-link" onClick={() => setTab('activity')} data-testid="activity-view-all">View all</button></header>
              <ul className="sh3-act">{activity.slice(0, 3).map((a, i) => <li key={a.title} className={i === 0 ? 'latest' : ''}><i /><div><strong>{a.title}</strong><span>{a.at} · {a.by}</span></div></li>)}</ul>
            </section>
            <section className="sh-card sh3-side sh3-help" data-testid="shipment-help">
              <i><MessageSquare /></i><div><strong>Questions about this shipment?</strong><span>Your Goorin rep replies within one business day.</span></div><button className="mk-btn" onClick={() => setTab('conversation')} data-testid="help-message">Message</button>
            </section>
          </aside>
        </div>
      )}

      {tab === 'booking' && (
        <div className="sh3-grid sh3-grid--even" data-testid="tab-panel-booking">
          <section className="sh-card" data-testid="shipping-instructions">
            <header><div><h2>Customer booking</h2><p>How your shipment leaves the factory.</p></div>{!edit && <button className="co-edit" onClick={() => { setForm(si); setEdit(true); }} data-testid="si-edit"><Pencil /> Edit</button>}</header>
            {edit ? (
              <div className="co-form sh-form" data-testid="si-form">
                <label className="co-field"><span>Booking method</span><div className="co-segment">{(['Freight forwarder', 'Customer pickup'] as const).map((m) => <button key={m} type="button" className={form.method === m ? 'active' : ''} onClick={() => setForm({ ...form, method: m })} data-testid={`si-method-${m.split(' ')[0].toLowerCase()}`}>{m}</button>)}</div></label>
                {form.method === 'Freight forwarder' && <>
                  <div className="co-row"><label className="co-field"><span>Forwarder</span><input value={form.forwarder} onChange={(e) => setForm({ ...form, forwarder: e.target.value })} data-testid="si-forwarder" /></label><label className="co-field"><span>Contact name</span><input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} data-testid="si-contact" /></label></div>
                  <div className="co-row"><label className="co-field"><span>Email</span><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="si-email" /></label><label className="co-field"><span>Phone</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="si-phone" /></label></div>
                </>}
                <div className="co-row"><label className="co-field"><span>Transport</span><select className="mk-select" value={form.transport} onChange={(e) => setForm({ ...form, transport: e.target.value })} data-testid="si-transport">{['Ocean', 'Air', 'Ground'].map((t) => <option key={t}>{t}</option>)}</select></label><CountrySelect value={form.country} onChange={(v) => setForm({ ...form, country: v })} testId="si-country" /></div>
                <label className="co-field"><span>Notes for the factory <em>(optional)</em></span><textarea className="co-input sh-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Carrier account #, pickup windows, labeling…" data-testid="si-notes" /></label>
                <div className="co-actions"><button className="co-secondary" onClick={() => setEdit(false)} data-testid="si-cancel">Cancel</button><button className="co-primary" disabled={form.method === 'Freight forwarder' && (!form.forwarder.trim() || !form.email.trim())} onClick={() => { setSi(form); setEdit(false); notify('Shipping instructions updated · factory notified'); }} data-testid="si-save">Save instructions</button></div>
              </div>
            ) : (
              <dl className="sh3-kv">
                <div><dt>Booking method</dt><dd data-testid="si-method">{si.method}</dd></div>
                <div><dt>Transport mode</dt><dd data-testid="si-transport-value">{si.transport}</dd></div>
                {si.method === 'Freight forwarder' && <>
                  <div><dt>Forwarder</dt><dd>{si.forwarder}</dd></div>
                  <div><dt>Contact</dt><dd>{si.contact} · <a href={`mailto:${si.email}`}>{si.email}</a></dd></div>
                  <div><dt>Phone</dt><dd>{si.phone}</dd></div>
                  <div><dt>Country</dt><dd>{si.country}</dd></div>
                </>}
                <div><dt>Submitted</dt><dd>{fmt(s.created)}, 12:48 AM</dd></div>
                {si.notes && <div><dt>Notes</dt><dd className="muted">{si.notes}</dd></div>}
              </dl>
            )}
            <div className="sh3-docsec">
              <header><div><h3>Booking / forwarder documents</h3><p>PDF, PNG, or JPEG · max 10MB per file. Documents remain private.</p></div><button className="mk-btn sh3-upload" onClick={pickDocs} data-testid="shipment-upload"><Upload /> Upload</button></header>
              {docs.length > 0 && <ul className="sh3-files" data-testid="uploaded-docs">{docs.map((d) => <li key={d}><button className="sh3-file" onClick={() => dl(d)}><i><FileText /></i><span><b>{d}</b><small>Uploaded just now</small></span><Download /></button></li>)}</ul>}
            </div>
          </section>
          <section className="sh-card" data-testid="prepayment-card">
            <header><div><h2>Payment</h2><p>50% Prepay / 50% Net 60</p></div><span className="dash-pill tone-green"><i />Prepayment received</span></header>
            <p className="sh3-money" data-testid="prepay-amount">{money(prepay)}</p>
            <p className="sh3-sub">paid of {money(total)} declared value</p>
            <div className="sh3-split" aria-hidden><i style={{ width: '50%' }} /></div>
            <ul className="sh3-sched">
              <li className="paid"><i><Check /></i><div><strong>50% prepayment</strong><span>Paid {fmt(s.created)} · Visa •••• 4242</span></div><b>{money(prepay)}</b></li>
              <li><i>2</i><div><strong>50% balance · Net 60</strong><span>Invoiced after the shipment leaves the factory</span></div><b>{money(total - prepay)}</b></li>
            </ul>
            <div className="sh3-note"><p>Nothing else is due right now. Your remaining balance is invoiced once the shipment ships and is due 60 days after invoice.</p><button className="mk-btn" onClick={() => dl('Prepayment receipt.pdf')} data-testid="prepay-receipt"><Download /> Download receipt</button></div>
          </section>
        </div>
      )}

      {tab === 'conversation' && (
        <section className="sh-card sh3-chat" data-testid="shipment-chat">
          <header className="sh3-chat-head"><i><MessageSquare /></i><div><h2>Shipment conversation</h2><p>Visible to you and the Goorin Bros. team · replies notify you by email.</p></div><span className="sh3-chat-count">{msgs.length} messages</span></header>
          <div className="sh3-msgs">
            {msgs.map((m, i) => <div key={i} className={`sh3-msg ${m.mine ? 'mine' : ''}`} data-testid={`chat-msg-${i}`}><span className="sh3-msg-avatar">{initials(m.who)}</span><div><small>{m.who} · {m.at}</small><p>{m.text}</p></div></div>)}
            <div ref={endRef} />
          </div>
          <div className="sh3-compose"><textarea value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Write a message to Goorin…" data-testid="chat-input" /><button className="co-primary" onClick={send} disabled={!draft.trim()} data-testid="chat-send"><Send /> Send</button></div>
          <small className="sh3-hint">Enter to send · Shift + Enter for a new line</small>
        </section>
      )}

      {tab === 'documents' && (
        <div className="sh3-grid sh3-grid--even" data-testid="tab-panel-documents">
          <section className="sh-card"><header><div><h2>Shipment documents</h2><p>Generated by Goorin for this shipment.</p></div><button className="dash-link" onClick={() => notify(`${generated.length} documents downloading…`)} data-testid="docs-download-all">Download all</button></header>
            <ul className="sh3-files">{generated.map((d) => <li key={d}><button className="sh3-file" onClick={() => dl(`${d}.pdf`)} data-testid={`doc-${d.toLowerCase().replace(/\s+/g, '-')}`}><i><FileText /></i><span><b>{d}</b><small>PDF · {docMeta[d].size} · {docMeta[d].note}</small></span><Download /></button></li>)}</ul>
          </section>
          <section className="sh-card"><header><div><h2>Certificate of Origin</h2><p>Some customs authorities require a COO to clear goods.</p></div></header>
            <div className="sh-toggle sh3-coo sh3-coo--solo"><div><strong>Require a Certificate of Origin</strong><span>Applies to new international shipments only. Existing shipments are not altered.</span></div><button role="switch" aria-checked={coo} className={`sh-switch ${coo ? 'on' : ''}`} onClick={() => setCoo(!coo)} data-testid="coo-toggle-detail"><i /></button></div>
            <p className={`sh3-coo-state ${coo ? 'on' : ''}`} data-testid="coo-state">{coo ? <><Check /> A COO is included with this shipment's documents.</> : 'No COO will be generated for new shipments.'}</p>
          </section>
        </div>
      )}

      {tab === 'activity' && (
        <section className="sh-card" data-testid="tab-panel-activity"><header><div><h2>Activity</h2><p>Everything that has happened on this shipment.</p></div><span>{activity.length} events</span></header>
          <ol className="sh3-timeline">{activity.map((a, i) => { const Icon = eventIcon[a.kind]; return (
            <li key={a.title} className={i === 0 ? 'latest' : ''} data-testid={`activity-${i}`}><i><Icon /></i><div><strong>{a.title}</strong><span>{a.detail}</span><small>{a.at} · {a.by}</small></div></li>
          ); })}</ol>
        </section>
      )}
    </div>
  );
}
