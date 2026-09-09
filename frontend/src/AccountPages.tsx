import { useState } from 'react';
import { Copy, Download, FileText, FolderOpen, Image as ImageIcon, Link2, MapPin, Pencil, Plus, Save, Share2, Trash2, Upload, Video } from 'lucide-react';
import { useToast } from '@/lib/toast';
import { money } from '@/lib/money';
import './marketplace.css';
import './dashboard.css';
import './checkout.css';
import './orders.css';
import './account.css';

type Res = { id: string; name: string; type: 'pdf' | 'zip' | 'img' | 'video'; size: string; folder: string; updated: string; shared: boolean; thumb?: string };
const seed: Res[] = [
  { id: 'r1', name: 'SS27 Lookbook.pdf', type: 'pdf', size: '18.4 MB', folder: 'Lookbooks', updated: 'Sep 1, 2026', shared: true },
  { id: 'r2', name: 'Farm Animal Collection – Line Sheet.pdf', type: 'pdf', size: '6.2 MB', folder: 'Line sheets', updated: 'Aug 28, 2026', shared: true },
  { id: 'r3', name: 'Product photography – Truckers.zip', type: 'zip', size: '412 MB', folder: 'Photography', updated: 'Aug 20, 2026', shared: false, thumb: '/products/lone-wolf.webp' },
  { id: 'r4', name: 'Lone Wolf hero.webp', type: 'img', size: '1.1 MB', folder: 'Photography', updated: 'Aug 20, 2026', shared: true, thumb: '/products/lone-wolf.webp' },
  { id: 'r5', name: 'Brand guidelines 2026.pdf', type: 'pdf', size: '9.8 MB', folder: 'Brand', updated: 'Jul 2, 2026', shared: false },
  { id: 'r6', name: 'Retail display walkthrough.mp4', type: 'video', size: '96 MB', folder: 'Sales materials', updated: 'Jun 14, 2026', shared: false },
];
const Icon = ({ t }: { t: Res['type'] }) => (t === 'img' ? <ImageIcon /> : t === 'video' ? <Video /> : t === 'zip' ? <FolderOpen /> : <FileText />);

export function ResourcesPage() {
  const notify = useToast();
  const [items, setItems] = useState(seed);
  const [folder, setFolder] = useState('All');
  const [q, setQ] = useState('');
  const folders = ['All', ...Array.from(new Set(seed.map((r) => r.folder)))];
  const list = items.filter((r) => (folder === 'All' || r.folder === folder) && r.name.toLowerCase().includes(q.toLowerCase()));
  const share = (r: Res) => { navigator.clipboard?.writeText(`https://b2b.goorin.com/share/${r.id}`).catch(() => {}); setItems((xs) => xs.map((x) => (x.id === r.id ? { ...x, shared: true } : x))); notify('Share link copied · expires in 30 days'); };
  const upload = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.multiple = true; inp.onchange = () => { const f = Array.from(inp.files ?? []); setItems((xs) => [...f.map((x, i) => ({ id: `u${Date.now()}${i}`, name: x.name, type: (x.type.startsWith('image') ? 'img' : x.type.startsWith('video') ? 'video' : x.name.endsWith('.zip') ? 'zip' : 'pdf') as Res['type'], size: `${(x.size / 1048576).toFixed(1)} MB`, folder: 'My uploads', updated: 'Just now', shared: false })), ...xs]); notify(`${f.length} file${f.length === 1 ? '' : 's'} uploaded`); }; inp.click(); };
  return (
    <div className="ord" data-testid="resources-page">
      <div className="ac-hero"><div><h1>Resources</h1><p>Lookbooks, line sheets, photography and sales materials shared by your Goorin Bros. rep — plus files you share back.</p></div><button className="od-btn od-btn--dark" onClick={upload} data-testid="res-upload"><Upload /> Upload files</button></div>
      <div className="ord-bar"><div className="dash-segment" role="tablist">{folders.map((f) => <button key={f} role="tab" aria-selected={folder === f} className={folder === f ? 'active' : ''} onClick={() => setFolder(f)} data-testid={`res-folder-${f.toLowerCase().replace(/\s+/g, '-')}`}>{f}</button>)}</div><label className="dash-search ac-search"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files…" data-testid="res-search" /></label></div>
      <div className="ac-files">
        {list.map((r) => (
          <article key={r.id} className="ac-file" data-testid={`res-${r.id}`}>
            <div className={`ac-file-thumb t-${r.type}`}>{r.thumb ? <img src={r.thumb} alt="" /> : <Icon t={r.type} />}{r.shared && <span className="ac-shared"><Link2 /> Shared</span>}</div>
            <div className="ac-file-body"><strong title={r.name}>{r.name}</strong><span>{r.folder} · {r.size} · {r.updated}</span></div>
            <div className="ac-file-actions"><button onClick={() => notify(`${r.name} downloading…`)} aria-label="Download" data-testid={`res-dl-${r.id}`}><Download /></button><button onClick={() => share(r)} aria-label="Share link" data-testid={`res-share-${r.id}`}><Share2 /></button>{r.folder === 'My uploads' && <button onClick={() => setItems((xs) => xs.filter((x) => x.id !== r.id))} aria-label="Delete"><Trash2 /></button>}</div>
          </article>
        ))}
        {list.length === 0 && <div className="mk-empty" data-testid="res-empty"><FolderOpen /><strong>No files here yet</strong><span>Upload files to share them with your rep, or try another folder.</span></div>}
      </div>
    </div>
  );
}

export function StatementsPage() {
  const notify = useToast();
  const months = [{ m: 'September 2026', open: 51, paid: 0, current: true }, { m: 'August 2026', open: 0, paid: 34 }, { m: 'July 2026', open: 0, paid: 1128 }, { m: 'June 2026', open: 0, paid: 564 }, { m: 'April 2026', open: 0, paid: 1692 }, { m: 'January 2026', open: 0, paid: 846 }];
  return (
    <div className="ord" data-testid="statements-page">
      <div className="ac-hero"><div><h1>Statements of Account</h1><p>Statements are generated fresh with your current balance and open invoices — the "As of" date on the PDF shows when it was produced.</p></div><button className="od-btn" onClick={() => notify('Emailing current statement to ryan.mirabile@me.com')} data-testid="stmt-email"><Share2 /> Email statement</button></div>
      <div className="stat-grid ac-stats">
        <div className="stat stat--dark"><span className="stat-label">Open balance</span><strong className="stat-value">{money(51)}</strong><p className="stat-note">3 open orders · nothing past due. Terms 50% Prepay, 50% Net 60.</p></div>
        <div className="stat"><span className="stat-label">Paid year to date</span><strong className="stat-value">{money(4264)}</strong><p className="stat-note">Across 5 invoices since January.</p></div>
        <div className="stat"><span className="stat-label">Next due</span><strong className="stat-value stat-value--sm">Nov 4, 2026</strong><p className="stat-note">{money(8.5)} Net 60 balance on SO57017.</p></div>
      </div>
      <section className="dash-orders ord-card"><ul className="ac-list">
        {months.map((s) => (
          <li key={s.m} data-testid={`stmt-${s.m.replace(/\s+/g, '-').toLowerCase()}`}>
            <span className="od-thumb od-thumb--sm ac-doc"><FileText /></span>
            <div><strong>{s.m} {s.current && <em className="dash-pill tone-green">Current</em>}</strong><span>{s.current ? 'Reflects your account as of today' : `Closed · ${money(s.paid)} paid`}</span></div>
            <div className="ac-amt"><small>{s.current ? 'Open' : 'Paid'}</small><strong>{money(s.current ? s.open : s.paid)}</strong></div>
            <button className="od-btn" onClick={() => notify(`Statement ${s.m}.pdf downloading…`)} data-testid={`stmt-dl-${s.m.replace(/\s+/g, '-').toLowerCase()}`}><Download /> PDF</button>
          </li>
        ))}
      </ul></section>
    </div>
  );
}

type Addr = { id: string; name: string; company: string; line1: string; city: string; state: string; zip: string; country: string; use: 'Both' | 'Delivery' | 'Invoice'; isDefault: boolean };
export function ProfilePage() {
  const notify = useToast();
  const [c, setC] = useState({ email: 'ryan.mirabile@icloud.com', phone: '321-344-4590', mobile: '321-344-4590', website: 'https://www.mirabiledistro.com' });
  const [dirty, setDirty] = useState(false);
  const [addrs, setAddrs] = useState<Addr[]>([{ id: 'a1', name: 'Ryan Mirabile', company: 'Mirabile Distribution', line1: '15354 Rising View Dr # 1', city: 'Montverde', state: 'Florida', zip: '34756-3546', country: 'United States', use: 'Both', isDefault: true }]);
  const [editing, setEditing] = useState<Addr | null>(null);
  const set = (k: keyof typeof c) => (e: React.ChangeEvent<HTMLInputElement>) => { setC({ ...c, [k]: e.target.value }); setDirty(true); };
  const blank: Addr = { id: '', name: '', company: 'Mirabile Distribution', line1: '', city: '', state: '', zip: '', country: 'United States', use: 'Delivery', isDefault: false };
  const saveAddr = () => { if (!editing) return; if (!editing.name || !editing.line1 || !editing.city || !editing.zip) { notify('Name, street, city and ZIP are required', 'error'); return; } setAddrs((xs) => (editing.id ? xs.map((a) => (a.id === editing.id ? editing : a)) : [...xs, { ...editing, id: `a${Date.now()}` }])); setEditing(null); notify('Address saved'); };
  const F = ({ l, k }: { l: string; k: keyof Addr }) => <label className="co-field"><span>{l}</span><input value={String(editing?.[k] ?? '')} onChange={(e) => setEditing((a) => a && { ...a, [k]: e.target.value })} data-testid={`addr-${k}`} /></label>;
  return (
    <div className="ord" data-testid="profile-page">
      <section className="sh-card ac-sec"><header><h2>Contact details</h2><button className="od-btn od-btn--dark" disabled={!dirty} onClick={() => { setDirty(false); notify('Contact details saved'); }} data-testid="profile-save"><Save /> Save changes</button></header>
        <div className="co-row ac-form"><label className="co-field"><span>Email</span><input value={c.email} onChange={set('email')} data-testid="profile-email" /></label><label className="co-field"><span>Phone</span><input value={c.phone} onChange={set('phone')} data-testid="profile-phone" /></label><label className="co-field"><span>Mobile</span><input value={c.mobile} onChange={set('mobile')} data-testid="profile-mobile" /></label><label className="co-field"><span>Website</span><input value={c.website} onChange={set('website')} data-testid="profile-website" /></label></div>
      </section>
      <section className="sh-card ac-sec"><header><h2>Addresses <span>{addrs.length}</span></h2><button className="od-btn" onClick={() => setEditing(blank)} data-testid="addr-add"><Plus /> Add address</button></header>
        <div className="ac-addrs">{addrs.map((a) => (
          <div key={a.id} className="co-address" data-testid={`addr-${a.id}`}><MapPin className="ac-pin" /><div className="co-address-body"><strong>{a.name} {a.isDefault && <em className="dash-pill tone-green">Default</em>}</strong><span>{a.company}</span><span>{a.line1} · {a.city}, {a.state} {a.zip} · {a.country}</span></div><div className="co-address-side"><em>{a.use}</em><button className="co-edit" onClick={() => setEditing(a)} data-testid={`addr-edit-${a.id}`}><Pencil /> Edit</button>{!a.isDefault && <button className="co-edit" onClick={() => { setAddrs((xs) => xs.map((x) => ({ ...x, isDefault: x.id === a.id }))); notify('Default address updated'); }}>Make default</button>}</div></div>
        ))}</div>
        {editing && <div className="co-form ac-editor" data-testid="addr-form"><h3>{editing.id ? 'Edit address' : 'New address'}</h3><div className="co-row"><F l="Full name" k="name" /><F l="Company" k="company" /></div><F l="Street address" k="line1" /><div className="co-row"><F l="City" k="city" /><F l="State" k="state" /></div><div className="co-row"><F l="ZIP" k="zip" /><F l="Country" k="country" /></div>
          <div className="co-field"><span>Use address for</span><div className="co-segment">{(['Delivery', 'Invoice', 'Both'] as const).map((u) => <button key={u} type="button" className={editing.use === u ? 'active' : ''} onClick={() => setEditing({ ...editing, use: u })}>{u}</button>)}</div></div>
          <div className="co-actions"><button className="co-secondary" onClick={() => setEditing(null)} data-testid="addr-cancel">Cancel</button><button className="co-primary" onClick={saveAddr} data-testid="addr-save">Save address</button></div></div>}
      </section>
      <section className="sh-card ac-sec"><header><div><h2>Credit terms</h2><p>Your current payment terms and credit status</p></div><button className="od-btn" onClick={() => { navigator.clipboard?.writeText('Account #GB-48213 · Mirabile Distribution').catch(() => {}); notify('Account details copied'); }}><Copy /> Copy account #</button></header>
        <div className="ac-terms"><div><small>Payment terms</small><strong>50% Prepay, 50% Net 60</strong></div><div><small>Credit limit</small><strong>{money(5000)}</strong><span>{money(4983)} available</span></div><div><small>Standing</small><strong className="ok">Good</strong><span>No past-due balance</span></div><div><small>Account</small><strong>#GB-48213</strong><span>Sales rep · Ally Stevens</span></div></div>
      </section>
    </div>
  );
}
