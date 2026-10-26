# Server / client boundary

**Server components:** root layout, route-group layouts (metadata only), `app/(public)/page.tsx`, `cars/page.tsx`, `cars/[id]/page.tsx` (metadata, static params, JSON-LD), `signin`/`signup` wrappers, `sitemap.ts`, `robots.ts`, and static landing sections (`HowItWorks`, `NextSteps`).

**Client components (`"use client"`):** everything that touches `localStorage`/`sessionStorage`, session, forms, charts, the Leaflet map, dialogs, tables with sorting, and every private page.

**Why so much is client-side:** the brief mandates browser storage, which does not exist during SSR. Reading it on the server would be impossible, and reading it during first client render would cause hydration mismatches. The hooks in `lib/hooks.ts` use `useSyncExternalStore` with a stable server snapshot, so SSR and the first client render agree; pages show a loading state, then real data. `useHydrated()` tells "still loading" from "really empty".

**Heavy client-only libraries:** Leaflet is loaded with `next/dynamic` (`ssr: false`) and has a text fallback if tiles fail. Recharts charts sit in client components and each has a "view as table" fallback.

**Rule:** no secrets are used anywhere. The only env vars are `NEXT_PUBLIC_*` and non-secret.
