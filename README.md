# Sheggar Wheels

A peer-to-peer car rental marketplace for Addis Ababa, built with **Next.js 15 (App Router) + TypeScript** for the IBT–QIYAS Frontend Capstone. Visual design comes from the "sheger wheels" Figma file; behaviour comes from the capstone brief.

> **This is a front-end demo.** There is no backend and no database. Data lives in your browser (`localStorage`), the session lives in `sessionStorage`, payments are a pretend TeleBirr screen, and trip tracking is a timer-driven simulation. Nothing is secured or charged. See [AUTH.md](AUTH.md) and [FUTURE.md](FUTURE.md).

## What's in it
- **Visitor / renter:** landing page, catalogue (filters, sort, pagination in URL params), car detail with availability calendar and Leaflet map, booking request, mock checkout, bookings list (tabs, CSV export), booking detail with timeline, simulated tracking, reviews, derived notifications.
- **Owner:** listings CRUD (draft → pending review), availability editing, booking approve/decline/start/complete, earnings chart with table, reviews and replies, disputes.
- **Admin:** platform overview charts, listing approval, user suspend/reinstate, all bookings, dispute resolution, CSV report, announcements.
- Strict booking lifecycle (`requested → confirmed → in_progress → completed → reviewed`, plus decline / cancel / dispute / resolve) enforced in one place (`lib/domain.ts`).
- Live safety checks at `/checks` (the three required negative tests).

## Stack
Next.js 15, React 19, TypeScript, `next/font`, `next/image`, Recharts, Leaflet (OpenStreetMap tiles). No UI library; plain CSS with tokens taken from Figma.

## Setup
```bash
npm install
cp .env.example .env.local   # optional
npm run dev                  # http://localhost:3000
npm run typecheck
npm test                     # domain tests (tsx)
npm run build && npm start
```

## Demo accounts
Seeded accounts use the password `Demo1234`. Accounts you create use the password you choose (stored only as a salted hash in this browser). Sign in with email **or phone**.
Use the quick-pick buttons on `/signin` (they skip the password), or sign in with one of these:
| Role | Email |
|---|---|
| Owner + renter | selam@demo.sheggar.test, dawit@demo.sheggar.test |
| Renter | hana@demo.sheggar.test, yonas@demo.sheggar.test |
| Suspended renter | mekdes@demo.sheggar.test |
| Admin (seeded only) | admin@demo.sheggar.test |

"Reset demo data" in the banner restores the seed (hide it with `NEXT_PUBLIC_SHOW_RESET=false`).

## Docs
[STRATEGY](STRATEGY.md) · [BOUNDARY](BOUNDARY.md) · [AUTH](AUTH.md) · [DATA](DATA.md) · [PERF](PERF.md) · [FUTURE](FUTURE.md)

## Known limitations (honest list)
- **Live URL:** not deployed yet. _Add your deployment link here._
- **Screenshots / demo video:** not included yet.
- Content adapted from the Figma file's placeholder copy to Addis Ababa, ETB and Sheggar Wheels, per the brief.
- Car photos are generated placeholder illustrations (`public/cars`), not real photography. The hero/search icon is a placeholder.
- Cars created in one browser are not visible in another, are not in the sitemap, and have no server-rendered metadata.
- Not verified by me at the time of writing: a full `next build`, Lighthouse scores, pixel match to Figma. Run the commands above to confirm.
