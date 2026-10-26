# Performance

**Measured:** nothing yet. I have not run Lighthouse or a production build for this project, so no scores are claimed. Fill in the table after running `npm run build && npm start` and Lighthouse on `/`, `/cars` and `/cars/car-1` (mobile profile).

| Page | Performance | Accessibility | SEO | Notes |
|---|---|---|---|---|
| `/` | _todo_ | _todo_ | _todo_ | |
| `/cars` | _todo_ | _todo_ | _todo_ | |
| `/cars/[id]` | _todo_ | _todo_ | _todo_ | |

## Deliberate choices (not measurements)
- `next/font` (Inter, self-hosted) and `next/image` with explicit sizes; first three featured cards use `priority`.
- Cars are small generated SVGs, so image weight is low.
- Leaflet is `next/dynamic` with `ssr: false`, so it is not in the initial bundle of other pages.
- Recharts only loads on owner/admin pages.
- Catalogue state is in the URL, so results are shareable and back/forward works.

## Known risks
- Storage-backed pages render a loading state first, which can hurt LCP on first visit.
- Recharts is a heavy dependency; check the owner/admin bundle sizes in the build output.
