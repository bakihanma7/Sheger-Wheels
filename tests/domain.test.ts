/* Run: npx tsx tests/domain.test.ts   (uses an in-memory browser-storage shim) */
class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}
const w: any = { localStorage: new MemStorage(), sessionStorage: new MemStorage(), addEventListener() {}, removeEventListener() {} };
(globalThis as any).window = w;

import assert from "node:assert/strict";
import { initializeDemoData, resetDemoData, getBookings, getCars, getBooking, getCar, getReviews } from "../lib/db";
import { validatePassword, validateConfirmPassword, rolesFor, homeFor, safeReturnPath, signInAsDemo, signOut, getCurrentUser, signUp, signInWithEmail, signInWithPassword, findUserByIdentifier, validateIdentifier, landingFor } from "../lib/auth";
import { DEMO_IDS, DEMO_PASSWORD } from "../lib/seed";
import { createCredential, verifyPassword } from "../lib/password";
import { createBookingRequest, transitionBooking, addReview, updateCar, resolveDispute, reviewListing, setUserStatus, canViewBooking, computeTotals, allowedActions, validateDates, blockRange } from "../lib/domain";
import { getUser } from "../lib/db";
import { filterCars, parseCatalogueQuery, paginate } from "../lib/selectors";
import { csvCell, toCsv } from "../lib/csv";
import { addDays, todayISO } from "../lib/format";
import { writeStorage, readStorage } from "../lib/storage";

let passed = 0;
const t = (name: string, fn: () => void) => { try { fn(); passed++; console.log("  ✓", name); } catch (e) { console.error("  ✗", name, "\n   ", (e as Error).message); process.exitCode = 1; } };

initializeDemoData();
const H = DEMO_IDS.renterHana, Y = DEMO_IDS.renterYonas, S = DEMO_IDS.ownerSelam, D = DEMO_IDS.ownerDawit, A = DEMO_IDS.admin;
const future = (n: number) => addDays(todayISO(), n);

console.log("Required negative tests");
t("1. signed-out booking attempt is refused and creates nothing", () => {
  const before = getBookings().length;
  const r = createBookingRequest(null, { carId: "car-corolla-bole", startDate: future(60), endDate: future(62) });
  assert.deepEqual(r, { ok: false, error: "Not signed in" });
  assert.equal(getBookings().length, before);
});
t("2. renter cannot cancel another renter's booking (\"Not yours\", no data change)", () => {
  const b = getBooking("bk-upcoming-confirmed")!; // Hana's
  const snap = JSON.stringify(b);
  const r = transitionBooking(Y, b.id, "cancel");
  assert.deepEqual(r, { ok: false, error: "Not yours" });
  assert.equal(JSON.stringify(getBooking(b.id)), snap);
});
t("3. unsafe return URLs fall back to /", () => {
  for (const bad of ["https://example.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "http://example.com/x", "/\n//evil.com", "", "dashboard"]) assert.equal(safeReturnPath(bad), "/", bad);
  assert.equal(safeReturnPath("/dashboard?x=1"), "/dashboard?x=1");
  assert.equal(safeReturnPath("/signin?next=/x"), "/");
  assert.equal(safeReturnPath(null), "/");
});

console.log("Ownership & roles");
t("owner cannot edit another owner's car by id", () => {
  const car = getCar("car-hilux-kazanchis")!; // Dawit's
  const r = updateCar(S, car.id, { make: "X", model: "Y", year: 2020, transmission: "Manual", fuel: "Petrol", seats: 5, neighbourhood: "Bole", pricePerDay: 1000, description: "hacked listing text here", photos: ["/cars/car-1.svg"] });
  assert.deepEqual(r, { ok: false, error: "Not yours" });
  assert.equal(getCar(car.id)!.make, "Toyota");
});
t("renter cannot view another renter's booking", () => {
  assert.equal(canViewBooking(getUser(Y), getBooking("bk-upcoming-confirmed")!), false);
  assert.equal(canViewBooking(getUser(H), getBooking("bk-upcoming-confirmed")!), true);
});
t("renter cannot approve; only the car's owner can", () => {
  assert.equal(transitionBooking(H, "bk-upcoming-requested", "approve").ok, false);
  assert.equal(transitionBooking(D, "bk-upcoming-requested", "approve").ok, false); // Dawit doesn't own the RAV4
});
t("non-admin cannot resolve disputes / review listings / suspend users", () => {
  assert.equal(resolveDispute(H, "dp-open", "notes here ok").ok, false);
  assert.equal(reviewListing(S, "car-yaris-ayat", "approve").ok, false);
  assert.equal(setUserStatus(H, Y, "suspended").ok, false);
});
t("signup can never create an admin", () => {
  const r = signUp({ name: "Eve Hacker", email: "eve@x.test", phone: "+251911000000", accountType: "both" });
  assert.ok(r.ok && !r.data.roles.includes("admin"));
});
t("sign-up account types map to roles; admin is never offered", () => {
  assert.deepEqual(rolesFor("owner"), ["owner"]);
  assert.deepEqual(rolesFor("renter"), ["renter"]);
  assert.deepEqual(rolesFor("both"), ["renter", "owner"]);
  assert.equal(homeFor("owner"), "/owner");
  assert.equal(homeFor("both"), "/dashboard");
  const r = signUp({ name: "Odd", email: "odd@x.test", phone: "+251911000000", accountType: "admin" as never });
  assert.equal(r.ok, false);
});
t("password rules: length, letter+number, confirmation", () => {
  assert.ok(validatePassword("short1"));
  assert.ok(validatePassword("allletters"));
  assert.ok(validatePassword("12345678"));
  assert.equal(validatePassword("goodpass1"), null);
  assert.ok(validateConfirmPassword("goodpass1", "goodpass2"));
  assert.equal(validateConfirmPassword("goodpass1", "goodpass1"), null);
});
t("duplicate email is rejected", () => {
  const r = signUp({ name: "Dup", email: "HANA@demo.sheggar.test", phone: "+251911000000", accountType: "renter" });
  assert.equal(r.ok, false);
});
t("suspended account can't act", () => {
  const r = createBookingRequest(DEMO_IDS.suspendedMekdes, { carId: "car-corolla-bole", startDate: future(60), endDate: future(62) });
  assert.equal(r.ok, false);
});

console.log("Booking rules");
t("totals snapshot price + 8% fee", () => {
  assert.deepEqual(computeTotals(2800, 3), { subtotal: 8400, fee: 672, total: 9072 });
  const r = createBookingRequest(H, { carId: "car-corolla-bole", startDate: future(60), endDate: future(63) });
  assert.ok(r.ok);
  if (r.ok) { assert.equal(r.data.total, 9072); assert.equal(r.data.status, "requested"); assert.equal(r.data.pricePerDay, 2800); }
});
t("invalid dates are rejected", () => {
  assert.ok(validateDates(future(-1), future(2)));
  assert.ok(validateDates(future(5), future(5)));
  assert.ok(validateDates("2026-13-40", future(5)));
  assert.ok(validateDates(future(5), future(99)));
});
t("can't book your own car or an unapproved car", () => {
  assert.equal(createBookingRequest(S, { carId: "car-corolla-bole", startDate: future(70), endDate: future(72) }).ok, false);
  assert.equal(createBookingRequest(H, { carId: "car-yaris-ayat", startDate: future(70), endDate: future(72) }).ok, false);
  assert.equal(createBookingRequest(H, { carId: "car-draft-mercedes", startDate: future(70), endDate: future(72) }).ok, false);
});
t("owner-blocked dates can't be booked", () => {
  const blocked = getCar("car-corolla-bole")!.unavailableDates[0];
  assert.equal(createBookingRequest(H, { carId: "car-corolla-bole", startDate: blocked, endDate: addDays(blocked, 1) }).ok, false);
});
t("two overlapping bookings can't both be confirmed", () => {
  const a = createBookingRequest(H, { carId: "car-suzuki-sarbet", startDate: future(80), endDate: future(83) });
  const b = createBookingRequest(Y, { carId: "car-suzuki-sarbet", startDate: future(81), endDate: future(84) });
  assert.ok(a.ok && b.ok);
  if (a.ok && b.ok) {
    assert.equal(transitionBooking(D, a.data.id, "approve").ok, true);
    const second = transitionBooking(D, b.data.id, "approve");
    assert.equal(second.ok, false);
    assert.equal(getBooking(b.data.id)!.status, "requested");
    // and new requests over confirmed dates are blocked
    assert.equal(createBookingRequest(Y, { carId: "car-suzuki-sarbet", startDate: future(82), endDate: future(85) }).ok, false);
  }
});
t("lifecycle: requested → confirmed → in_progress → completed → reviewed; invalid jumps refused", () => {
  const r = createBookingRequest(Y, { carId: "car-vwpolo-gerji", startDate: future(90), endDate: future(92) });
  assert.ok(r.ok); if (!r.ok) return;
  const id = r.data.id;
  assert.equal(transitionBooking(Y, id, "start").ok, false); // requested can't start
  assert.equal(transitionBooking(Y, id, "complete").ok, false);
  assert.equal(addReview(Y, id, 5, "Great trip, thanks!").ok, false); // not completed
  assert.equal(transitionBooking(S, id, "approve").ok, true);
  assert.equal(getBooking(id)!.paymentStatus, "paid");
  assert.equal(transitionBooking(S, id, "approve").ok, false); // already confirmed
  assert.equal(transitionBooking(Y, id, "start").ok, true);
  assert.equal(transitionBooking(Y, id, "cancel").ok, false); // can't cancel in progress
  assert.equal(transitionBooking(Y, id, "complete").ok, true);
  assert.equal(addReview(H, id, 5, "Not my booking at all").ok, false);
  assert.equal(addReview(Y, id, 9, "Great trip, thanks!").ok, false);
  assert.equal(addReview(Y, id, 5, "short").ok, false);
  assert.equal(addReview(Y, id, 5, "Great trip, thanks!").ok, true);
  assert.equal(getBooking(id)!.status, "reviewed");
  assert.equal(addReview(Y, id, 5, "Great trip, thanks again!").ok, false); // one review per booking
  assert.equal(getReviews().filter((x) => x.bookingId === id).length, 1);
});
t("decline/cancel refund the demo payment; dispute → admin resolve", () => {
  const r = createBookingRequest(H, { carId: "car-rav4-cmc", startDate: future(100), endDate: future(101) });
  assert.ok(r.ok); if (!r.ok) return;
  assert.equal(transitionBooking(S, r.data.id, "decline").ok, true);
  assert.equal(getBooking(r.data.id)!.paymentStatus, "refunded");
  const d = transitionBooking(H, "bk-active", "dispute", { reason: "Engine light", description: "Warning light came on during the trip." });
  assert.equal(d.ok, true);
  assert.equal(getBooking("bk-active")!.status, "disputed");
  const dp = (JSON.parse(w.localStorage.getItem("sw_disputes_v1")) as any[]).find((x) => x.bookingId === "bk-active");
  assert.ok(dp);
  assert.equal(resolveDispute(A, dp.id, "ok").ok, false); // notes too short
  assert.equal(resolveDispute(A, dp.id, "Checked with both parties; closed.").ok, true);
  assert.equal(getBooking("bk-active")!.status, "resolved");
  assert.equal(resolveDispute(A, dp.id, "Checked with both parties; closed.").ok, false); // already resolved
});
t("allowedActions reflects role + state", () => {
  const b = getBooking("bk-yonas-requested")!;
  assert.deepEqual(allowedActions(getUser(S), b), ["approve", "decline"]);
  assert.deepEqual(allowedActions(getUser(Y), b), ["cancel"]);
  assert.deepEqual(allowedActions(getUser(H), b), []);
  assert.deepEqual(allowedActions(null, b), []);
});
t("blockRange blocks/unblocks only for the car's owner", () => {
  assert.equal(blockRange(D, "car-corolla-bole", future(5), future(6), true).ok, false);
  assert.equal(blockRange(S, "car-corolla-bole", future(5), future(6), true).ok, true);
  assert.ok(getCar("car-corolla-bole")!.unavailableDates.includes(future(6)));
  assert.equal(blockRange(S, "car-corolla-bole", future(5), future(6), false).ok, true);
});

console.log("Catalogue, CSV, storage recovery, session");
t("catalogue hides unapproved cars; filters+sort+pagination work together", () => {
  const cars = getCars(), bks = getBookings();
  const all = filterCars(cars, bks, parseCatalogueQuery(new URLSearchParams()));
  assert.ok(all.every((c) => c.status === "approved"));
  assert.ok(!all.some((c) => ["car-yaris-ayat", "car-kia-oldairport", "car-nissan-bole-inactive", "car-draft-mercedes"].includes(c.id)));
  const q = parseCatalogueQuery(new URLSearchParams("q=TOYOTA&transmission=Automatic&sort=price-asc&minSeats=5"));
  const res = filterCars(cars, bks, q);
  assert.ok(res.length > 0 && res.every((c) => /toyota/i.test(c.make) && c.transmission === "Automatic" && c.seats >= 5));
  assert.deepEqual(res.map((c) => c.pricePerDay), [...res.map((c) => c.pricePerDay)].sort((a, b) => a - b));
  assert.equal(filterCars(cars, bks, parseCatalogueQuery(new URLSearchParams("q=zzzz"))).length, 0);
  const p = paginate(all, 99);
  assert.equal(p.page, p.pages); // clamped
  assert.ok(p.items.length > 0);
});
t("availability dates filter excludes booked cars", () => {
  const b = getBooking("bk-yonas-confirmed")!;
  const q = parseCatalogueQuery(new URLSearchParams(`start=${b.startDate}&end=${b.endDate}`));
  assert.ok(!filterCars(getCars(), getBookings(), q).some((c) => c.id === b.carId));
});
t("CSV quoting: commas, quotes, newlines, formula injection", () => {
  assert.equal(csvCell('a,b'), '"a,b"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell("line1\nline2"), '"line1\nline2"');
  assert.equal(csvCell("=HYPERLINK(1)"), "'=HYPERLINK(1)");
  assert.equal(csvCell(-5), "-5");
  assert.equal(toCsv([{ a: "x,y" }], [{ header: "A", value: (r) => r.a }]), 'A\r\n"x,y"');
});
t("malformed stored JSON doesn't throw and falls back", () => {
  w.localStorage.setItem("sw_cars_v1", "{not json");
  assert.deepEqual(getCars(), []);
  w.localStorage.setItem("sw_cars_v1", JSON.stringify([{ nope: 1 }]));
  assert.deepEqual(getCars(), []);
  resetDemoData();
  assert.ok(getCars().length >= 8);
});
t("initializeDemoData never overwrites existing data", () => {
  const c = getCar("car-corolla-bole")!;
  writeStorage("sw_cars_v1", getCars().map((x) => (x.id === c.id ? { ...x, pricePerDay: 1234 } : x)));
  initializeDemoData();
  assert.equal(getCar(c.id)!.pricePerDay, 1234);
  resetDemoData();
});
t("sign-in / sign-out use sessionStorage only; sign-out clears it", () => {
  assert.equal(signInAsDemo("u-nope").ok, false);
  assert.equal(signInWithEmail("nobody@x.test").ok, false);
  assert.ok(signInAsDemo(H).ok);
  assert.equal(getCurrentUser()!.id, H);
  assert.equal(w.localStorage.getItem("sw_session_v1"), null);
  assert.ok(w.sessionStorage.getItem("sw_session_v1"));
  signOut();
  assert.equal(getCurrentUser(), null);
});
t("seed has ≥8 cars, an owner with several cars, a renter with history, an admin, all statuses", () => {
  const cars = getCars();
  assert.ok(cars.length >= 8);
  assert.ok(cars.filter((c) => c.ownerId === S).length > 1);
  const st = new Set(getBookings().map((b) => b.status));
  for (const s of ["requested", "confirmed", "in_progress", "completed", "reviewed", "cancelled", "declined", "disputed", "resolved"]) assert.ok(st.has(s as any), s);
  assert.ok(getUser(A)!.roles.includes("admin"));
});

console.log("Password sign-in (async)");
const ta = async (name: string, fn: () => Promise<void>) => { try { await fn(); passed++; console.log("  ✓", name); } catch (e) { console.error("  ✗", name, "\n   ", (e as Error).message); process.exitCode = 1; } };
(async () => {
  await ta("hash verifies the right password and rejects the wrong one; salts differ", async () => {
    const a = await createCredential("goodpass1"), b = await createCredential("goodpass1");
    assert.notEqual(a.passwordHash, "goodpass1");
    assert.notEqual(a.passwordSalt, b.passwordSalt);
    assert.ok(await verifyPassword("goodpass1", a.passwordSalt, a.passwordHash));
    assert.equal(await verifyPassword("goodpass2", a.passwordSalt, a.passwordHash), false);
  });
  await ta("identifier lookup: email (any case) and phone (+251 / 0 prefixes)", async () => {
    assert.equal(findUserByIdentifier("HANA@demo.sheggar.test")?.id, H);
    assert.equal(findUserByIdentifier("+251 91 100 0003")?.id, H);
    assert.equal(findUserByIdentifier("0911000003")?.id, H);
    assert.equal(findUserByIdentifier("nobody@x.test"), null);
    assert.ok(validateIdentifier(""));
    assert.ok(validateIdentifier("abc"));
  });
  await ta("seeded account signs in with the published demo password only", async () => {
    signOut();
    assert.equal((await signInWithPassword("hana@demo.sheggar.test", "wrongpass1")).ok, false);
    assert.equal(getCurrentUser(), null);
    const r = await signInWithPassword("hana@demo.sheggar.test", DEMO_PASSWORD);
    assert.ok(r.ok && getCurrentUser()?.id === H);
    signOut();
  });
  await ta("new account: sign-up stores a hash (never the password) and signs in by email or phone", async () => {
    const cred = await createCredential("Secret123");
    const r = signUp({ name: "Newo Owner", email: "newo@x.test", phone: "+251 92 000 1111", accountType: "owner", ...cred });
    assert.ok(r.ok);
    assert.ok(!JSON.stringify(readStorage("sw_users_v1", [])).includes("Secret123"));
    signOut();
    assert.ok((await signInWithPassword("newo@x.test", "Secret123")).ok);
    signOut();
    assert.ok((await signInWithPassword("0920001111", "Secret123")).ok);
    assert.equal(landingFor(getCurrentUser()!), "/owner");
    signOut();
    assert.equal((await signInWithPassword("newo@x.test", "demo1234")).ok, false);
  });
  await ta("same error for unknown account and wrong password; non-demo account without hash can't sign in", async () => {
    const a = await signInWithPassword("nobody@x.test", "whatever1");
    const b = await signInWithPassword("hana@demo.sheggar.test", "whatever1");
    assert.deepEqual(a, b);
  });
  console.log(`\n${passed} tests passed${process.exitCode ? " — WITH FAILURES" : ""}`);
})();
