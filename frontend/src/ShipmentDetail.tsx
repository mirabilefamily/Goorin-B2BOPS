import { useState } from 'react';
import { ArrowLeft, Check, CheckCircle2, Download, FileText, Lock, MessageSquare, Pencil, Send, Upload } from 'lucide-react';
import { useToast } from '@/lib/toast';
import { money } from '@/lib/money';
import { CountrySelect } from './CountrySelect';
import { fmt, shipLines, shipTotal, shipUnits, stageLabel, stageTone, stages, type Shipment } from './lib/shipments';

type Tab = 'overview' | 'booking' | 'conversation' | 'documents' | 'activity';
type Msg = { who: string; mine: boolean; text: string; at: string };
const stamp = () => new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const seedMsgs = (s: Shipment): Msg[] => [
  { who: 'Goorin Ops', mine: false, text: `Booking confirmed with ${s.forwarder} — ${s.transport.toLowerCase()}, ETD ${fmt(s.order.shipStart)}.`, at: `${fmt(s.created)}, 9:27 PM` },
  { who: 'Ryan M', mine: true, text: 'Great — packing list is final on our side. Releasing to factory once prepayment clears.', at: `${fmt(s.created)}, 9:31 PM` },
  { who: 'Goorin Ops', mine: false, text: 'Prepayment received. Factory has been released.', at: `${fmt(s.created)}, 12:49 AM` },
];
const daysUntil = (iso: string) => Math.max(0, Math.round((new Date(`${iso}T12:00:00`).getTime() - Date.now()) / 86400000));

export function Detail({ s, onBack, coo, setCoo }: { s: Shipment; onBack: () => void; coo: boolean; setCoo: (v: boolean) => void }) {
  const notify = useToast();
  const [tab, setTab] = useState<Tab>('overview');
  const [msgs, setMsgs] = useState<Msg[]>(() => seedMsgs(s));
  const [draft, setDraft] = useState('');
  const [si, setSi] = useState({ method: 'Freight forwarder' as 'Freight forwarder' | 'Customer pickup', forwarder: s.forwarder, contact: 'Name', email: 'name@ff123.com', phone: '3213444590', country: 'United States', transport: s.transport, notes: '' });
  const [form, setForm] = useState(si);
  const [edit, setEdit] = useState(false);
  const [docs, setDocs] = useState<string[]>([]);
  const pickDocs = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.multiple = true; inp.accept = '.pdf,.png,.jpg,.jpeg'; inp.onchange = () => { const names = Array.from(inp.files ?? []).map((f) => f.name); if (names.length) { setDocs((d) => [...names, ...d]); notify(`${names.length} document${names.length === 1 ? '' : 's'} uploaded`); } }; inp.click(); };
  const send = () => { if (!draft.trim()) return; setMsgs((m) => [...m, { who: 'Ryan M', mine: true, text: draft.trim(), at: stamp() }]); setDraft(''); };
  const lines = shipLines(s);
  const total = shipTotal(s);
  const units = shipUnits(s);
  const prepay = total / 2;
  const eta = fmt(s.order.shipStart);
  const days = daysUntil(s.order.shipStart);
  const generated = ['Packing List', 'Commercial Invoice', ...(coo ? ['Certificate of Origin'] : [])];
  const activity = [
    { title: 'Customer message sent', at: `${fmt(s.created)}, 3:29 AM`, by: 'Ryan M' },
    { title: 'Released to factory', at: `${fmt(s.created)}, 12:50 AM`, by: 'Goorin Ops' },
    { title: 'Prepayment received', at: `${fmt(s.created)}, 12:49 AM`, by: 'Stripe' },
    { title: 'Shipping instructions submitted', at: `${fmt(s.created)}, 12:48 AM`, by: 'Ryan M' },
    { title: 'Shipment created', at: `${fmt(s.created)}, 12:40 AM`, by: 'Goorin Ops' },
  ];
  const nextStep = s.stage >= 6 ? null : stages[s.stage + 1];
  const nextHint: Record<string, string> = { Shipped: 'Goorin will confirm once the factory hands off to your forwarder.', Invoiced: 'Your final invoice is issued after the shipment leaves the factory.', Released: 'Factory release follows once prepayment and shipping instructions are complete.' };
  const tabs: { id: Tab; label: string; n?: number }[] = [
    { id: 'overview', label: 'Overview' }, { id: 'booking', label: 'Booking & payment' }, { id: 'conversation', label: 'Conversation', n: msgs.length },
    { id: 'documents', label: 'Documents', n: generated.length }, { id: 'activity', label: 'Activity', n: activity.length },
  ];
  const dl = (name: string) => notify(`${name} downloading…`);

  return (
    <div className="sh sh--v3" data-testid="shipment-detail">
      <div className="sh-head"><button className="pb-back" onClick={onBack} data-testid="shipment-back"><ArrowLeft /> Shipments</button></div>

      <section className="sh3-hero" data-testid="shipment-hero">
        <div className="sh3-hero-top">
          <div className="sh3-id">
            <p className="pb-eyebrow">International shipment</p>
            <h1>{s.id} <span className={`dash-pill tone-${stageTone(s)}`}><i />{stageLabel(s)}</span></h1>
            <p className="sh3-sub sh3-hero-sub">{s.order.factory} · Created {fmt(s.created)}</p>
          </div>
          <div className="sh3-hero-actions">
            <button className="co-secondary sh3-btn" onClick={() => setTab('conversation')} data-testid="hero-message"><MessageSquare /> Message Goorin</button>
            <button className="co-primary sh3-btn" onClick={() => notify(`${generated.length} documents downloading…`)} data-testid="hero-download"><Download /> Download documents</button>
          </div>
        </div>
        <dl className="sh3-facts">
          <div><dt>{s.order.estimated ? 'Est. ship date' : 'Ship date'}</dt><dd>{eta}</dd></div>
          <div><dt>Mode</dt><dd>{si.transport}</dd></div>
          <div><dt>Incoterms</dt><dd>{s.incoterms} · USD</dd></div>
          <div><dt>Units</dt><dd>{units.toLocaleString()}</dd></div>
          <div><dt>Declared value</dt><dd>{money(total)}</dd></div>
          <div><dt>Prepayment · received</dt><dd className="good">{money(prepay)}</dd></div>
        </dl>
        {s.stage < 5 && <span className="sh3-chip" data-testid="ships-in">Ships in {days}d · {eta}</span>}
        <ol className="sh3-steps" data-testid="shipment-stages">
          {stages.map((st, i) => { const state = i < s.stage ? 'done' : i === s.stage ? 'current' : ''; return (
            <li key={st} className={state}><i>{i < s.stage ? <Check /> : i + 1}</i><strong>{st}</strong><small>{i < s.stage ? 'Done' : i === s.stage ? 'In progress' : 'Upcoming'}</small></li>
          ); })}
        </ol>
        {nextStep && <p className="sh3-next" data-testid="next-step">Next step: <strong>{nextStep}</strong> — {nextHint[nextStep] ?? 'We will keep you posted here.'}</p>}
      </section>

      <nav className="sh3-tabs" role="tablist" data-testid="shipment-tabs">
        {tabs.map((t) => <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)} data-testid={`tab-${t.id}`}>{t.label}{t.n !== undefined && <em>{t.n}</em>}</button>)}
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
              <header><h2>Shipment lines</h2><span>From factory packing list · read-only</span></header>
              <div className="dash-table-wrap sh-lines-scroll" data-testid="shipment-lines-scroll"><table className="dash-table od-table sh3-table"><thead><tr><th>SKU</th><th>SO #</th><th>Description</th><th className="r">Qty</th><th className="r">Unit value</th><th className="r">Amount</th></tr></thead>
                <tbody>{lines.map((l, i) => <tr key={l.sku + i}><td className="mono">{l.sku}</td><td className="dash-td-id">{s.order.id}</td><td>{l.name}</td><td className="r">{l.qty}</td><td className="r">{money(l.price)}</td><td className="r dash-td-total">{money(l.qty * l.price)}</td></tr>)}</tbody>
                <tfoot><tr><td colSpan={3}>Total · {lines.length} lines</td><td className="r">{units.toLocaleString()}</td><td /><td className="dash-td-total r" data-testid="shipment-subtotal">{money(total)}</td></tr></tfoot></table></div>
            </section>
          </div>
          <aside className="sh-col">
            <section className="sh-card sh3-side" data-testid="shipment-quick-docs">
              <header><h2>Documents</h2><button className="dash-link" onClick={() => setTab('documents')} data-testid="docs-view-all">View all</button></header>
              <ul className="sh3-files">
                {generated.map((d) => <li key={d}><button className="sh3-file" onClick={() => dl(`${d}.pdf`)} data-testid={`overview-doc-${d.toLowerCase().replace(/\s+/g, '-')}`}><FileText /><span>{d} (PDF)</span><Download /></button></li>)}
              </ul>
            </section>
            <section className="sh-card sh3-side" data-testid="shipment-recent-activity">
              <header><h2>Recent activity</h2><button className="dash-link" onClick={() => setTab('activity')} data-testid="activity-view-all">View all</button></header>
              <ul className="sh3-act">{activity.slice(0, 3).map((a, i) => <li key={a.title} className={i === 0 ? 'latest' : ''}><i /><div><strong>{a.title}</strong><span>{a.at} · {a.by}</span></div></li>)}</ul>
            </section>
          </aside>
        </div>
      )}

      {tab === 'booking' && (
        <div className="sh3-grid sh3-grid--even" data-testid="tab-panel-booking">
          <section className="sh-card" data-testid="shipping-instructions">
            <header><h2>Customer booking</h2>{!edit && <button className="co-edit" onClick={() => { setForm(si); setEdit(true); }} data-testid="si-edit"><Pencil /> Edit</button>}</header>
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
              <dl className="sh3-dl sh3-dl--2">
                <div><dt>Booking method</dt><dd data-testid="si-method">{si.method}</dd></div>
                <div><dt>Transport mode</dt><dd data-testid="si-transport-value">{si.transport}</dd></div>
                {si.method === 'Freight forwarder' && <div className="full"><dt>Freight forwarder</dt><dd>{si.forwarder}</dd><small>{si.email} · {si.phone} · {si.country}</small></div>}
                <div className="full"><dt>Submitted</dt><dd>{fmt(s.created)}, 12:48 AM</dd></div>
                {si.notes && <div className="full"><dt>Notes</dt><dd className="muted">{si.notes}</dd></div>}
              </dl>
            )}
            <div className="sh3-docsec">
              <header><h3>Booking / forwarder documents</h3><button className="mk-btn sh3-upload" onClick={pickDocs} data-testid="shipment-upload"><Upload /> Upload</button></header>
              {docs.length > 0 ? <ul className="sh3-files" data-testid="uploaded-docs">{docs.map((d) => <li key={d}><button className="sh3-file" onClick={() => dl(d)}><FileText /><span>{d}</span><Download /></button></li>)}</ul>
                : <p>PDF, PNG, or JPEG · max 10MB per file. Documents remain private.</p>}
            </div>
          </section>
          <section className="sh-card" data-testid="prepayment-card">
            <header><h2>Prepayment</h2><span className="dash-pill tone-green"><i />Received</span></header>
            <p className="sh3-money" data-testid="prepay-amount">{money(prepay)}</p>
            <p className="sh3-sub">50% of declared value · terms 50% Prepay / 50% Net 60</p>
            <dl className="sh3-dl sh3-dl--2 sh3-dl--tight">
              <div><dt>Paid on</dt><dd>{fmt(s.created)}</dd></div>
              <div><dt>Method</dt><dd>Visa •••• 4242</dd></div>
              <div><dt>Remaining balance</dt><dd>{money(total - prepay)}</dd></div>
              <div><dt>Due</dt><dd>Net 60 after ship</dd></div>
            </dl>
            <div className="sh3-note"><p>Your remaining 50% is invoiced once the shipment leaves the factory. Nothing else is due right now.</p><button className="mk-btn" onClick={() => dl('Prepayment receipt.pdf')} data-testid="prepay-receipt"><Download /> Download receipt</button></div>
          </section>
        </div>
      )}

      {tab === 'conversation' && (
        <section className="sh-card sh3-chat" data-testid="shipment-chat">
          <header className="sh3-chat-head"><i><MessageSquare /></i><div><h2>Shipment conversation</h2><p>Visible to you and the Goorin Bros. team · replies notify you by email.</p></div></header>
          <div className="sh3-msgs">
            {msgs.map((m, i) => <div key={i} className={`sh3-msg ${m.mine ? 'mine' : ''}`} data-testid={`chat-msg-${i}`}><small>{m.who} · {m.at}</small><p>{m.text}</p></div>)}
          </div>
          <div className="sh3-compose"><textarea value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Write a message..." data-testid="chat-input" /><button className="co-primary" onClick={send} disabled={!draft.trim()} data-testid="chat-send"><Send /> Send</button></div>
          <small className="sh3-hint">Enter to send · Shift + Enter for a new line</small>
        </section>
      )}

      {tab === 'documents' && (
        <div className="sh3-grid sh3-grid--even" data-testid="tab-panel-documents">
          <section className="sh-card"><header><h2>Shipment documents</h2><button className="dash-link" onClick={() => notify(`${generated.length} documents downloading…`)} data-testid="docs-download-all">Download all</button></header>
            <ul className="sh3-files">{generated.map((d) => <li key={d}><button className="sh3-file" onClick={() => dl(`${d}.pdf`)} data-testid={`doc-${d.toLowerCase().replace(/\s+/g, '-')}`}><FileText /><span>{d} (PDF)</span><Download /></button></li>)}</ul>
          </section>
          <section className="sh-card"><header><h2>Certificate of Origin</h2></header>
            <div className="sh-toggle sh3-coo sh3-coo--solo"><div><strong>Require a Certificate of Origin</strong><span>Applies to new international shipments only. Existing shipments are not altered.</span></div><button role="switch" aria-checked={coo} className={`sh-switch ${coo ? 'on' : ''}`} onClick={() => setCoo(!coo)} data-testid="coo-toggle-detail"><i /></button></div>
          </section>
        </div>
      )}

      {tab === 'activity' && (
        <section className="sh-card" data-testid="tab-panel-activity"><header><h2>Activity</h2><span>{activity.length} events</span></header>
          <ul className="sh3-act sh3-act--full">{activity.map((a, i) => <li key={a.title} className={i === 0 ? 'latest' : ''}><i /><div><strong>{a.title}</strong><span>{a.at} · {a.by}</span></div></li>)}</ul>
        </section>
      )}
    </div>
  );
}
