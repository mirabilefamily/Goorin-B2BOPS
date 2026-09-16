import { orders, type Order } from '@/lib/orders';

export type Shipment = { id: string; order: Order; created: string; stage: number; coo: boolean; incoterms: string; transport: string; forwarder: string; prepaidAt: string; paid: boolean; instructions: boolean };
export const stages = ['Draft', 'Ready', 'Shipping Instructions', 'Pre-payment', 'Released', 'Shipped', 'Invoiced'];
export const shipments: Shipment[] = orders.filter((o) => o.shipment).map((o) => ({
  id: o.shipment!, order: o, created: o.date, coo: o.status !== 'Open',
  stage: o.status === 'Open' ? 4 : o.status === 'Shipped' ? 5 : 6,
  incoterms: 'FOB', transport: 'Ocean', forwarder: 'FF 123', prepaidAt: `${o.date} 12:49 AM`, paid: true, instructions: true,
}));
const pendingOrder: Order = { id: 'SO58802', ref: 'SS27 | Drop 3 | Mirabile Distribution', date: '2026-09-10', shipStart: '2027-01-13', shipEnd: '2027-01-20', estimated: true, factory: 'ASI Global Limited (China)', shipment: 'IS-0014', status: 'Open', payment: 'Partially Paid', lines: [] };
shipments.unshift({ id: 'IS-0014', order: pendingOrder, created: '2026-09-10', coo: false, stage: 2, incoterms: 'FOB', transport: 'Ocean', forwarder: '', prepaidAt: '', paid: true, instructions: false });
const styleNames = ['The GOAT', 'The Gorilla', 'Lone Wolf', 'Black Sheep', 'The Panther', 'El Gallo', 'Crush', 'Floater', 'The Koala', 'The Deer Rack', 'Papa Core', 'The Cancelled Skull'];
const colors = ['BLK01', 'DEN01', 'WHT02', 'OLV01', 'NVY01', 'GRY02', 'GRN04', 'BIS01', 'VOI01', 'EDG01'];
export type ShipLine = { sku: string; name: string; qty: number; price: number };
export const shipLines = (s: Shipment): ShipLine[] => {
  if (s.order.status !== 'Open') return s.order.lines.map((l) => ({ sku: l.sku, name: l.name, qty: l.qty, price: l.price }));
  const seed = parseInt(s.id.replace(/\D/g, ''), 10) || 1;
  return Array.from({ length: 100 }, (_, i) => {
    const n = (i * 7 + seed) % styleNames.length;
    const c = (i * 3 + seed) % colors.length;
    return { sku: `101-${String(175 + ((i * 37 + seed * 11) % 2400)).padStart(4, '0')}-${colors[c]}-O/S`, name: styleNames[n], qty: 6 + ((i * 3 + seed) % 5) * 6, price: i % 4 === 0 ? 16 : 8.5 };
  });
};
export const shipTotal = (s: Shipment) => shipLines(s).reduce((t, l) => t + l.qty * l.price, 0);
export const shipUnits = (s: Shipment) => shipLines(s).reduce((t, l) => t + l.qty, 0);
export const fmt = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
export const stageLabel = (s: Shipment) => (s.stage >= 6 ? 'Invoiced' : s.stage === 5 ? 'Shipped' : s.stage >= 4 ? 'Prepaid' : 'Action needed');
export const stageTone = (s: Shipment) => (s.stage >= 6 ? 'green' : s.stage === 5 ? 'teal' : s.stage >= 4 ? 'blue' : 'amber');
