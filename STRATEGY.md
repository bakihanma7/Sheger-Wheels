# Rendering strategy

Data is in browser storage, so the server can never know it. The rule used throughout: **server components only for what needs the server (metadata, static params, JSON-LD, Suspense shells); everything that reads storage is a client component that renders a loading state until hydrated.**

| Route | Strategy | Why |
|---|---|---|
| `/` | Static shell + client sections | Copy is static; stats/featured cars read storage. |
| `/cars` | Static shell + client catalogue | Filters/sort/page live in URL params (`useSearchParams` inside Suspense); results come from storage. |
| `/cars/[id]` | `generateStaticParams` for seeded cars, `generateMetadata`, JSON-LD; client body | Seeded cars get real metadata and structured data. A car created locally shows the client view only (metadata falls back to a generic title). JSON-LD contains no rating data. |
| `/signin`, `/signup` | Static shell + client form | Form + sessionStorage. |
| `/checks` | Client | Runs live checks against the storage layer. |
| `/dashboard`, `/bookings`, `/bookings/[id]`, `/track`, `/review`, `/checkout`, `/checkout/success` | Client pages inside `(renter)` RoleGate | Need session + storage. `noindex`. |
| `/owner/**` | Client pages inside `(owner)` shell | Same. `noindex`. |
| `/admin/**` | Client pages inside `(admin)` shell | Same. `noindex`. |
| `/sitemap.xml`, `/robots.txt` | Generated | Public routes + seeded car pages; private areas disallowed (guidance only, not security). |

Dynamic params use `useParams` in client pages. Server `params` are awaited (Next 15).
