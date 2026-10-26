# Future work

## Cut or simplified (be honest)
- Real payments: TeleBirr is a mock screen only.
- Real-time tracking: a timer-driven simulation along a fixed path.
- Notifications are derived from records; there are no push/email events.
- Photo upload: owners pick from built-in placeholders.
- Cars created locally have no server-rendered metadata and are not in the sitemap.
- Listing photos, hero and story images are placeholders instead of the Figma photography.

## What a real backend must own
Authentication (hashed passwords or OAuth, httpOnly cookies), server-side authorisation on every write, a database with transactions (overlap checks must be atomic), payment provider integration with webhooks, file storage for images, audit logs, and rate limiting. The domain functions' signatures (`actorId`, `Result<T>`) were chosen so they can become server actions or API handlers.

## Next steps
1. Move `lib/domain.ts` behind server actions / route handlers; keep `checkTransition` shared.
2. Replace storage hooks with data fetching (`fetch` + cache tags).
3. Server-render the catalogue and car pages for SEO.
4. Playwright tests for the booking flow and the three negative tests.
5. Measure with Lighthouse and fill in PERF.md.
