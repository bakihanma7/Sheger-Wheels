# Authentication and authorisation (demo-level)

> **This is not production security.** Anyone with browser dev tools can edit `localStorage`/`sessionStorage`, change roles, or bypass any check in this repo. The checks below demonstrate the *shape* of correct authorisation; real enforcement needs a server. See FUTURE.md.

## Sessions and passwords
**Sign-up** is a 7-step wizard: name → email → phone → password → confirm password → "Which one are you?" (owner / renter / owner + renter) → go to dashboard. Passwords need 8+ characters with a letter and a number. Only a **salted PBKDF2-SHA256 hash** (Web Crypto, `lib/password.ts`) is stored on the user record; the password itself is never saved. The **admin role can never be chosen** (admins are seeded only).

**Sign-in** is 2 steps: email *or phone number* → password. Unknown accounts and wrong passwords return the same message. Seeded demo accounts have no stored hash and accept only the published demo password (`Demo1234`, shown on the sign-in page). The "pick a demo account" shortcuts skip the password on purpose. Owners-only accounts land on `/owner`, admins on `/admin`, everyone else on `/dashboard`.

The session `{ userId, signedInAt }` is in **sessionStorage**, so closing the tab signs you out.

**Why this isn't real security:** the hash sits in `localStorage` where anyone with dev tools can read or replace it, PBKDF2 runs in the browser, and there is no lockout or rate limiting. It only keeps passwords from being stored as plain text. Don't reuse a real password.

## Guards
- **Route guard (UX only):** `RoleGate` redirects signed-out users to `/signin?next=…` and shows a clear message to wrong-role users. Admin/owner areas use `WorkspaceShell` the same way.
- **Action guard (the one that matters in this demo):** every write in `lib/domain.ts` takes the acting user id, re-reads the stored session user, and re-checks role, ownership, suspension and state *before writing*. UI buttons are driven by the same `checkTransition` function, so they cannot disagree with the write path.

## The three required negative tests
Implemented in `tests/domain.test.ts` (run `npm test`) and live at `/checks`:
1. Signed-out user cannot create a booking → "Not signed in".
2. A renter cannot read or change another renter's booking → "Not yours".
3. An illegal state change (e.g. completing a requested booking, or approving a cancelled one) is refused with a reason.

Additional covered cases: non-admin cannot approve listings, owner cannot edit another owner's car, suspended users are blocked, bad dates and overlaps are rejected.

## Safe return path
`?next=` values go through `safeReturnPath` (`lib/auth.ts`): only same-site relative paths are accepted. Absolute URLs, `//host`, backslashes, control characters, over-long values, and `/signin`/`/signup` loops fall back to `/`.

## Not done
No server-side hashing, no CSRF/session tokens, no rate limiting or lockout, no password reset, no real identity. Don't enter real personal data.
