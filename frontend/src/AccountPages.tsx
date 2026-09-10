import { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, FileText, FolderOpen, Image as ImageIcon, Link2, MapPin, Pencil, Plus, Save, Search, Share2, Upload, Video } from 'lucide-react';
import { useToast } from '@/lib/toast';
import { money } from '@/lib/money';
import { useBackable } from '@/lib/nav';
import './marketplace.css';
import './dashboard.css';
import './checkout.css';
import './orders.css';
import './account.css';

type Res = { id: string; name: string; ext: string; type: 'pdf' | 'zip' | 'img' | 'video'; size: string; updated: string; thumb?: string; shared?: boolean };
type Folder = { id: string; name: string; date: string; latest?: boolean; cover?: string; files: Res[] };
const seedFolders: Folder[] = [
  { id: 'ss27', name: 'SS27', date: 'Sep 2026', latest: true, cover: '/products/lone-wolf.webp', files: [
    { id: 'f1', name: 'SS27 Lookbook', ext: '.pdf', type: 'pdf', size: '18.4 MB', updated: 'Sep 2026' },
    { id: 'f2', name: 'Farm Animal Collection – Line Sheet', ext: '.pdf', type: 'pdf', size: '6.2 MB', updated: 'Sep 2026' },
    { id: 'f3', name: 'lone_wolf_hero', ext: '.webp', type: 'img', size: '1.1 MB', updated: 'Aug 2026', thumb: '/products/lone-wolf.webp' },
    { id: 'f4', name: 'panther_hero', ext: '.webp', type: 'img', size: '0.9 MB', updated: 'Aug 2026', thumb: '/products/panther.webp' } ] },
  { id: 'fw26', name: 'FW26', date: 'Mar 2026', cover: '/products/black-sheep.webp', files: [
    { id: 'f5', name: 'FW26 Lookbook', ext: '.pdf', type: 'pdf', size: '21.0 MB', updated: 'Mar 2026' },
    { id: 'f6', name: 'Product photography – Truckers', ext: '.zip', type: 'zip', size: '412 MB', updated: 'Mar 2026' },
    { id: 'f7', name: 'black_sheep_hero', ext: '.webp', type: 'img', size: '1.0 MB', updated: 'Mar 2026', thumb: '/products/black-sheep.webp' } ] },
  { id: 'brand', name: 'Brand Assets', date: 'Jul 2026', files: [
    { id: 'f8', name: 'b2b_ops_dark', ext: '.webp', type: 'img', size: '34.5 KB', updated: 'Jul 2026', thumb: '/b2b_ops_dark.webp' },
    { id: 'f9', name: 'Brand guidelines 2026', ext: '.pdf', type: 'pdf', size: '9.8 MB', updated: 'Jul 2026' } ] },
  { id: 'sales', name: 'Sales Materials', date: 'Jun 2026', files: [
    { id: 'f10', name: 'Retail display walkthrough', ext: '.mp4', type: 'video', size: '96 MB', updated: 'Jun 2026' } ] },
];
const Icon = ({ t }: { t: Res['type'] }) => (t === 'img' ? <ImageIcon /> : t === 'video' ? <Video /> : t === 'zip' ? <FolderOpen /> : <FileText />);
const kinds = (fs: Res[]) => { const c: Record<string, number> = {}; fs.forEach((f) => { const k = f.type === 'img' ? 'IMG' : f.type.toUpperCase(); c[k] = (c[k] ?? 0) + 1; }); return Object.entries(c); };

export function ResourcesPage() {
  const notify = useToast();
  const [folders, setFolders] = useState(seedFolders);
  const [openId, setOpenId] = useState<string | null>(null);
  useBackable(!!openId, () => { setOpenId(null); setQ(''); });
  const [q, setQ] = useState('');
  const folder = folders.find((f) => f.id === openId) ?? null;
  const upload = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.multiple = true; inp.onchange = () => { const fs = Array.from(inp.files ?? []); const target = folder?.id ?? 'uploads'; setFolders((all) => { const exists = all.some((f) => f.id === target); const add = fs.map((x, i) => { const dot = x.name.lastIndexOf('.'); return { id: `u${Date.now()}${i}`, name: dot > 0 ? x.name.slice(0, dot) : x.name, ext: dot > 0 ? x.name.slice(dot) : '', type: (x.type.startsWith('image') ? 'img' : x.type.startsWith('video') ? 'video' : x.name.endsWith('.zip') ? 'zip' : 'pdf') as Res['type'], size: x.size > 1048576 ? `${(x.size / 1048576).toFixed(1)} MB` : `${(x.size / 1024).toFixed(1)} KB`, updated: 'Just now' }; }); return exists ? all.map((f) => (f.id === target ? { ...f, files: [...add, ...f.files] } : f)) : [{ id: 'uploads', name: 'My Uploads', date: 'Just now', files: add }, ...all]; }); notify(`${fs.length} file${fs.length === 1 ? '' : 's'} uploaded`); }; inp.click(); };
  const share = (f: Res) => { navigator.clipboard?.writeText(`https://b2b.goorin.com/share/${f.id}`).catch(() => {}); setFolders((all) => all.map((fo) => ({ ...fo, files: fo.files.map((x) => (x.id === f.id ? { ...x, shared: true } : x)) }))); notify('Share link copied · expires in 30 days'); };

  if (folder) {
    const files = folder.files.filter((f) => (f.name + f.ext).toLowerCase().includes(q.toLowerCase()));
    return (
      <div className="ord" data-testid="resources-folder">
        <nav className="rs-crumb"><button onClick={() => { setOpenId(null); setQ(''); }} data-testid="res-back"><ChevronLeft /> Resources</button><span>{folder.name}</span></nav>
        <div className="rs-folderhead">
          <span className="rs-foldericon"><FolderOpen /></span>
          <div><h1>{folder.name} {folder.latest && <em className="rs-latest rs-latest--blue">Latest</em>}</h1><p>{folder.date} · {folder.files.length} file{folder.files.length === 1 ? '' : 's'}</p></div>
          <div className="rs-tools"><label className="dash-search"><Search /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter files..." data-testid="res-filter" /></label><button className="od-btn od-btn--dark" onClick={upload} data-testid="res-upload"><Upload /> Upload</button></div>
        </div>
        <section className="dash-orders ord-card"><div className="dash-table-wrap"><table className="dash-table od-table rs-table">
          <thead><tr><th>Name</th><th>Updated</th><th>Size</th><th className="r">Action</th></tr></thead>
          <tbody>{files.map((f) => (
            <tr key={f.id} data-testid={`res-file-${f.id}`}>
              <td><div className="rs-file"><span className={`rs-thumb t-${f.type}`}>{f.thumb ? <img src={f.thumb} alt="" /> : <Icon t={f.type} />}</span><strong>{f.name} <small>{f.ext}</small></strong>{f.shared && <em className="dash-pill tone-green"><Link2 /> Shared</em>}</div></td>
              <td className="muted">{f.updated}</td><td className="muted">{f.size}</td>
              <td className="r"><div className="rs-actions"><button className="od-btn" onClick={() => share(f)} aria-label="Share" data-testid={`res-share-${f.id}`}><Share2 /></button><button className="od-btn" onClick={() => notify(`${f.name}${f.ext} downloading…`)} data-testid={`res-dl-${f.id}`}><Download /> Download</button></div></td>
            </tr>
          ))}</tbody></table></div>
          {files.length === 0 && <div className="mk-empty ord-empty" data-testid="res-empty"><FolderOpen /><strong>No files match</strong><span>Try a different filter.</span></div>}
        </section>
      </div>
    );
  }

  return (
    <div className="ord" data-testid="resources-page">
      <div className="ac-hero"><div><h1>Resources</h1><p>Seasonal lookbooks, line sheets, photography and brand assets — organized by collection.</p></div><button className="od-btn od-btn--dark" onClick={upload} data-testid="res-upload"><Upload /> Upload files</button></div>
      <div className="rs-grid">
        {folders.map((fo) => (
          <button key={fo.id} className="rs-card" onClick={() => setOpenId(fo.id)} data-testid={`res-folder-${fo.id}`}>
            <div className="rs-cover">{fo.cover && <img src={fo.cover} alt="" />}<strong>{fo.name}</strong>{fo.latest && <em className="rs-latest">Latest</em>}<i className="rs-tab" /></div>
            <div className="rs-body"><strong>{fo.name}</strong><span>{fo.date}</span></div>
            <div className="rs-foot"><div className="rs-kinds">{kinds(fo.files).map(([k, n]) => <em key={k}>{n} {k}</em>)}</div><ChevronRight /></div>
          </button>
        ))}
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
  const [addrs, setAddrs] = useState<Addr[]>([
    { id: 'a1', name: 'Ryan Mirabile', company: 'Mirabile Distribution', line1: '15354 Rising View Dr # 1', city: 'Montverde', state: 'Florida', zip: '34756-3546', country: 'United States', use: 'Both', isDefault: true },
    { id: 'a2', name: 'Receiving – Orlando DC', company: 'Mirabile Distribution', line1: '4410 Distribution Ct, Dock 3', city: 'Orlando', state: 'Florida', zip: '32809', country: 'United States', use: 'Delivery', isDefault: false },
    { id: 'a3', name: 'Accounts Payable', company: 'Mirabile Distribution', line1: 'PO Box 1188', city: 'Clermont', state: 'Florida', zip: '34712', country: 'United States', use: 'Invoice', isDefault: false },
  ]);
  const [editing, setEditing] = useState<Addr | null>(null);
  const set = (k: keyof typeof c) => (e: React.ChangeEvent<HTMLInputElement>) => { setC({ ...c, [k]: e.target.value }); setDirty(true); };
  const blank: Addr = { id: '', name: '', company: 'Mirabile Distribution', line1: '', city: '', state: '', zip: '', country: 'United States', use: 'Delivery', isDefault: false };
  const saveAddr = () => { if (!editing) return; if (!editing.name || !editing.line1 || !editing.city || !editing.zip) { notify('Name, street, city and ZIP are required', 'error'); return; } setAddrs((xs) => (editing.id ? xs.map((a) => (a.id === editing.id ? editing : a)) : [...xs, { ...editing, id: `a${Date.now()}` }])); setEditing(null); notify('Address saved'); };
  const F = ({ l, k }: { l: string; k: keyof Addr }) => <label className="co-field"><span>{l}</span><input value={String(editing?.[k] ?? '')} onChange={(e) => setEditing((a) => a && { ...a, [k]: e.target.value })} data-testid={`addr-${k}`} /></label>;
  return (
    <div className="ord ac-profile" data-testid="profile-page">
      <div className="ac-main">
      <section className="sh-card ac-sec"><header><h2>Contact details</h2><button className="od-btn od-btn--dark" disabled={!dirty} onClick={() => { setDirty(false); notify('Contact details saved'); }} data-testid="profile-save"><Save /> Save changes</button></header>
        <div className="co-row ac-form"><label className="co-field"><span>Email</span><input value={c.email} onChange={set('email')} data-testid="profile-email" /></label><label className="co-field"><span>Phone</span><input value={c.phone} onChange={set('phone')} data-testid="profile-phone" /></label><label className="co-field"><span>Mobile</span><input value={c.mobile} onChange={set('mobile')} data-testid="profile-mobile" /></label><label className="co-field"><span>Website</span><input value={c.website} onChange={set('website')} data-testid="profile-website" /></label></div>
      </section>
      <section className="sh-card ac-sec"><header><h2>Addresses <span>{addrs.length}</span></h2><button className="od-btn" onClick={() => setEditing(blank)} data-testid="addr-add"><Plus /> Add address</button></header>
        <div className="ac-addrs">{addrs.map((a) => (
          <div key={a.id} className={`ac-addr ${a.isDefault ? 'is-default' : ''}`} data-testid={`addr-${a.id}`}>
            <div className="ac-addr-top"><span className={`ac-use use-${a.use.toLowerCase()}`}>{a.use === 'Both' ? 'Ship & bill' : a.use === 'Delivery' ? 'Ship to' : 'Bill to'}</span>{a.isDefault && <em className="dash-pill tone-green">Default</em>}</div>
            <strong>{a.name}</strong><span>{a.company}</span>
            <address>{a.line1}<br />{a.city}, {a.state} {a.zip}<br />{a.country}</address>
            <div className="ac-addr-actions"><button onClick={() => setEditing(a)} data-testid={`addr-edit-${a.id}`}><Pencil /> Edit</button>{!a.isDefault && <button onClick={() => { setAddrs((xs) => xs.map((x) => ({ ...x, isDefault: x.id === a.id }))); notify('Default address updated'); }} data-testid={`addr-default-${a.id}`}>Make default</button>}{!a.isDefault && <button className="danger" onClick={() => { setAddrs((xs) => xs.filter((x) => x.id !== a.id)); notify('Address removed'); }} data-testid={`addr-remove-${a.id}`}>Remove</button>}</div>
          </div>
        ))}
          <button className="ac-addr ac-addr--new" onClick={() => setEditing(blank)} data-testid="addr-add-card"><Plus /><strong>Add another address</strong><span>Warehouses, stores or billing contacts</span></button>
        </div>
        {editing && <div className="co-form ac-editor" data-testid="addr-form"><h3>{editing.id ? 'Edit address' : 'New address'}</h3><div className="co-row"><F l="Full name" k="name" /><F l="Company" k="company" /></div><F l="Street address" k="line1" /><div className="co-row"><F l="City" k="city" /><F l="State" k="state" /></div><div className="co-row"><F l="ZIP" k="zip" /><F l="Country" k="country" /></div>
          <div className="co-field"><span>Use address for</span><div className="co-segment">{(['Delivery', 'Invoice', 'Both'] as const).map((u) => <button key={u} type="button" className={editing.use === u ? 'active' : ''} onClick={() => setEditing({ ...editing, use: u })}>{u}</button>)}</div></div>
          <div className="co-actions"><button className="co-secondary" onClick={() => setEditing(null)} data-testid="addr-cancel">Cancel</button><button className="co-primary" onClick={saveAddr} data-testid="addr-save">Save address</button></div></div>}
      </section>
      </div>
      <aside className="ac-side">
      <section className="sh-card ac-sec"><header><div><h2>Credit terms</h2><p>Your current payment terms and credit status</p></div></header>
        <div className="ac-terms"><div><small>Payment terms</small><strong>50% Prepay, 50% Net 60</strong></div><div><small>Credit limit</small><strong>{money(5000)}</strong><span>{money(4983)} available</span><div className="dash-bar ac-credit"><span style={{ width: '0.4%' }} /></div></div><div><small>Standing</small><strong className="ok">Good</strong><span>No past-due balance</span></div><div><small>Account</small><strong>#GB-48213</strong><span>Sales rep · Ally Stevens · ally@goorin.com</span></div></div>
      </section>
      </aside>
    </div>
  );
}
