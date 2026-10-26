# Data model

All data is demo data. No database; no network.

## Storage keys
| Key | Area | Contents |
|---|---|---|
| `sw_users_v1`, `sw_cars_v1`, `sw_bookings_v1`, `sw_reviews_v1`, `sw_disputes_v1`, `sw_announcements_v1` | localStorage | Arrays of records |
| `sw_session_v1` | sessionStorage | Signed-in user id |
| `sw_checkout_draft_v1` | sessionStorage | Booking being checked out |

## Entities (`lib/types.ts`)
`User` (roles, status active/suspended) · `Car` (owner, specs, price/day in ETB, status draft/pending/approved/rejected/inactive, blocked dates, popularity) · `Booking` (dates, price **snapshot**, 8% service fee, status, paymentStatus held/paid/refunded, mock payment ref) · `Review` · `Dispute` (with messages and resolution) · `Announcement`.

## Seed
`lib/seed.ts`: 6 users (owners, renters, a suspended renter, an admin), 12 Addis Ababa cars across all statuses, 13 bookings covering every status, 2 reviews, 2 disputes, 1 announcement. IDs are stable. `initializeDemoData` seeds only keys that are *absent*, so it never overwrites user changes; "Reset" re-seeds explicitly.

## Access
Pages never touch `localStorage` directly. They use `lib/db.ts` getters/savers and the `lib/hooks.ts` subscriptions, which update across components and tabs (custom pub-sub + `storage` event).

## Validation and recovery
- Domain functions validate input (dates, 30-day max rental, overlaps with confirmed/in-progress bookings, owner-blocked dates, price/seat ranges) and return `Result<T>` rather than throwing.
- Malformed JSON or wrong shape in a key is treated as missing, the fallback is used, and the banner shows a storage message instead of crashing. Quota/denied-storage errors are caught the same way.
- CSV export quotes per RFC 4180 and prefixes cells starting with `= + - @` to avoid spreadsheet formula injection.
- Money and dates use `lib/format.ts` (ETB, ISO dates).
