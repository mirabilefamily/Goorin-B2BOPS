# SYNC 2.0 / Goorin B2B Ops – PRD

Original request: port attached Vite/TS Bolt project into CRA env as a pixel-perfect frontend app shell. Auth + data are MOCKED (localStorage stub in src/lib/supabase.ts).

## Changelog
- 2026-06: Replaced brand logo (sidebar expanded + login topbar) with `/public/b2b_ops_dark.webp` (Goorin B2B Ops). Collapsed sidebar icon unchanged.
- 2026-06: Sidebar nav → "My Account" (Dashboard, Marketplace, Pre-Book, My Orders, Shipments, Resources, Statements, Profile & Addresses) + Settings footer; global --accent changed red→green (#00d4a1).
- 2026-06: New `DashboardPage.tsx` + `dashboard.css` (greeting hero, YTD spend dark card w/ sparkline, balance & terms cards, quick actions that navigate, Recent Orders table w/ Recent/All toggle, search, sort, CSV export). Non-dashboard nav items show a "coming soon" placeholder.
- 2026-06: Login page refined: guest button & signup removed, "Need access? Contact your administrator.", grey Log in until filled, stacked footer. Mock auth: any email + password ≥6 chars.
- Legacy pages (Monitoring, Flows, AI Canvas, Connections, Runs, Activity, Field Watch) still exist in src but are no longer reachable from nav.

## Backlog
- P1: Build Marketplace, Pre-Book, My Orders, Shipments, Resources, Statements, Profile & Addresses pages
- P1: Real backend (FastAPI/Mongo) for orders, balances, auth
- P2: Update topbar (cart icon, account badge like reference), search placeholder copy
- 2026-06: Dashboard refinement — topbar cart btn + account chip (Ryan M / AS / Mirabile Distribution), account summary strip, YTD ↔ Last-12-mo spend toggle w/ monthly bars + tooltips, order detail drawer (timeline, tracking, line items, totals, Reorder/Invoice toasts), Upcoming shipments + Announcements widgets, skeleton loader, staggered reveals, rich empty state. Tested (iteration_2, 46/46 pass).
- 2026-06: Per user, removed added widgets (Announcements, Upcoming shipments) and account summary strip. Dashboard now = hero → 3 stat cards (spend bars + range toggle) → quick actions → Recent Orders (row click opens order drawer). Login: clicking Log in with empty fields signs in as demo account.
- 2026-06: Design polish pass on dashboard — hero (accent tick, gradient name, date pill, thin rule w/ black tab), count-up numbers, bars grow-in, grain/glow on dark card, balance card stacked past-due/current bar + legend, terms card Prepay/Net 60 segments, card glyphs, quick-action hover accent underline + icon tilt, tighter table rhythm w/ tinted header. Notification bell dot stays RED (#ff3048) per user — do not change.
- 2026-06: Stat card refinement — unified visual language (cards 2 & 3 both use segmented bar + legend), removed Prepay/Net60 boxes and "live data" text, slimmer chips/toggles/glyphs (34–36px), trackless bars w/ baseline + 3-letter month labels, tighter paddings (28px), quick actions 48px icons w/ 2-line clamp subtitles.
- 2026-06: Stat cards + quick actions redesigned per design_agent blueprint (/app/design_guidelines.json): flat 24px-padded cards (.stat / .stat--dark), label-top + 32px value, 42px minimal bar chart w/ 3-label axis + tooltip, short explanatory note, 2-col dt/dd meta footer (no mini bars/segments), 28px chips. Quick actions (.qa) are vertical: 42px green-tint icon, title, subtitle, CTA link. Tested iteration_3 (all pass). Note: dev tooling wraps dynamic text in <span>; never style bare `dd span` — use explicit classes.
