import type { Announcement, Booking, BookingStatus, Car, CarStatus, Dispute, Fuel, Result, Review, Transmission, User } from "./types";
import { NOT_YOURS, hasRole, resolveActor } from "./auth";
import { getBooking, getBookings, getCar, getCars, getDisputes, getReviews, getAnnouncements, getUser, getUsers, saveAnnouncement, saveBooking, saveCar, saveDispute, saveReview, saveUser } from "./db";
import { FEE_RATE } from "./seed";
import { addDays, daysBetween, eachDate, isISODate, todayISO } from "./format";
import { demoPaymentRef, uid } from "./id";

/**
 * Business rules. Every function takes the ACTING user id explicitly and re-checks session,
 * role, ownership and current state BEFORE writing. UI hiding is a convenience, not the guard.
 */

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });
const STORAGE_FAIL = "Couldn't save because browser storage is unavailable or full.";

/* ---------- Pricing & availability ---------- */

export function computeTotals(pricePerDay: number, days: number) {
  const subtotal = Math.round(pricePerDay * days);
  const fee = Math.round(subtotal * FEE_RATE);
  return { subtotal, fee, total: subtotal + fee };
}

export const BLOCKING_STATUSES: BookingStatus[] = ["confirmed", "in_progress"];
export const MAX_RENTAL_DAYS = 30;

export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function isCarPublic(car: Car | null | undefined): car is Car {
  return !!car && car.status === "approved";
}

export function validateDates(startDate: string, endDate: string, today = todayISO()): string | null {
  if (!isISODate(startDate) || !isISODate(endDate)) return "Choose valid pickup and return dates.";
  if (startDate < today) return "Pickup date can't be in the past.";
  if (endDate <= startDate) return "Return date must be after the pickup date.";
  if (daysBetween(startDate, endDate) > MAX_RENTAL_DAYS) return `Rentals are limited to ${MAX_RENTAL_DAYS} days in this demo.`;
  return null;
}

/** null = available; otherwise a human-readable reason. */
export function unavailableReason(car: Car, start: string, end: string, bookings: Booking[], ignoreBookingId?: string): string | null {
  const blocked = eachDate(start, end).find((d) => car.unavailableDates.includes(d));
  if (blocked) return "The owner has blocked some of those dates.";
  const clash = bookings.find(
    (b) => b.carId === car.id && b.id !== ignoreBookingId && BLOCKING_STATUSES.includes(b.status) && rangesOverlap(start, end, b.startDate, b.endDate),
  );
  return clash ? "Those dates overlap another confirmed booking." : null;
}

export function isCarAvailable(car: Car, start: string, end: string, bookings: Booking[]): boolean {
  return validateDates(start, end) === null && unavailableReason(car, start, end, bookings) === null;
}

/* ---------- Booking lifecycle ---------- */

export type BookingAction = "approve" | "decline" | "cancel" | "start" | "complete" | "dispute";

export const TRANSITIONS: Record<BookingAction, { from: BookingStatus[]; to: BookingStatus; label: string }> = {
  approve: { from: ["requested"], to: "confirmed", label: "Approve" },
  decline: { from: ["requested"], to: "declined", label: "Decline" },
  cancel: { from: ["requested", "confirmed"], to: "cancelled", label: "Cancel booking" },
  start: { from: ["confirmed"], to: "in_progress", label: "Start rental" },
  complete: { from: ["in_progress"], to: "completed", label: "Mark returned" },
  dispute: { from: ["in_progress"], to: "disputed", label: "Raise an issue" },
};

/** Who may perform each action. */
function partyAllowed(action: BookingAction, actor: User, b: Booking): boolean {
  switch (action) {
    case "approve":
    case "decline":
      return b.ownerId === actor.id && hasRole(actor, "owner");
    case "cancel":
      return b.renterId === actor.id;
    case "start":
    case "complete":
    case "dispute":
      return b.renterId === actor.id || (b.ownerId === actor.id && hasRole(actor, "owner"));
  }
}

export function checkTransition(actorId: string | null, bookingId: string, action: BookingAction): Result<{ actor: User; booking: Booking }> {
  const a = resolveActor(actorId);
  if (!a.ok) return a;
  const booking = getBooking(bookingId);
  if (!booking) return fail("That booking no longer exists.");
  const rule = TRANSITIONS[action];
  if (!partyAllowed(action, a.data, booking)) return fail(NOT_YOURS);
  if (!rule.from.includes(booking.status)) return fail(`A ${booking.status.replace("_", " ")} booking can't be changed that way.`);
  if (action === "cancel" && booking.status === "confirmed" && booking.startDate <= todayISO())
    return fail("Confirmed bookings can only be cancelled before the pickup date.");
  if (action === "approve") {
    const car = getCar(booking.carId);
    if (!car) return fail("That car no longer exists.");
    const reason = unavailableReason(car, booking.startDate, booking.endDate, getBookings(), booking.id);
    if (reason) return fail(reason);
  }
  return { ok: true, data: { actor: a.data, booking } };
}

export function allowedActions(actor: User | null, booking: Booking): BookingAction[] {
  if (!actor) return [];
  return (Object.keys(TRANSITIONS) as BookingAction[]).filter((a) => {
    const r = checkTransition(actor.id, booking.id, a);
    return r.ok;
  });
}

export function transitionBooking(actorId: string | null, bookingId: string, action: BookingAction, issue?: { reason: string; description: string }): Result<Booking> {
  const check = checkTransition(actorId, bookingId, action);
  if (!check.ok) return check;
  const { actor, booking } = check.data;
  const rule = TRANSITIONS[action];

  if (action === "dispute") {
    if (!issue || issue.reason.trim().length < 3) return fail("Tell us briefly what went wrong.");
    if (issue.description.trim().length < 10) return fail("Please describe the issue in at least 10 characters.");
  }
  const now = new Date().toISOString();
  const next: Booking = {
    ...booking,
    status: rule.to,
    paymentStatus: action === "approve" ? "paid" : action === "decline" || action === "cancel" ? "refunded" : booking.paymentStatus,
    updatedAt: now,
  };
  if (!saveBooking(next)) return fail(STORAGE_FAIL);
  if (action === "dispute" && issue) {
    const d: Dispute = {
      id: uid(),
      bookingId,
      openedBy: actor.id,
      reason: issue.reason.trim(),
      description: issue.description.trim(),
      status: "open",
      messages: [{ by: actor.id, text: issue.description.trim(), at: now }],
      createdAt: now,
    };
    saveDispute(d);
  }
  return { ok: true, data: next };
}

export interface BookingRequestInput {
  carId: string;
  startDate: string;
  endDate: string;
}

export function validateBookingRequest(input: BookingRequestInput): Result<{ car: Car; days: number }> {
  const car = getCar(input.carId);
  if (!isCarPublic(car)) return fail("That car isn't available to book.");
  const dateErr = validateDates(input.startDate, input.endDate);
  if (dateErr) return fail(dateErr);
  const reason = unavailableReason(car, input.startDate, input.endDate, getBookings());
  if (reason) return fail(reason);
  return { ok: true, data: { car, days: daysBetween(input.startDate, input.endDate) } };
}

/** Creates a REQUEST (status "requested", mock payment "held"). Used by the mock checkout. */
export function createBookingRequest(actorId: string | null, input: BookingRequestInput): Result<Booking> {
  const a = resolveActor(actorId, "renter");
  if (!a.ok) return a;
  const v = validateBookingRequest(input);
  if (!v.ok) return v;
  const { car, days } = v.data;
  if (car.ownerId === a.data.id) return fail("You can't book your own car.");
  const totals = computeTotals(car.pricePerDay, days);
  const now = new Date().toISOString();
  const booking: Booking = {
    id: uid(),
    carId: car.id,
    renterId: a.data.id,
    ownerId: car.ownerId,
    startDate: input.startDate,
    endDate: input.endDate,
    days,
    pricePerDay: car.pricePerDay, // snapshot
    ...totals,
    paymentStatus: "held",
    paymentRef: demoPaymentRef(),
    status: "requested",
    createdAt: now,
    updatedAt: now,
  };
  if (!saveBooking(booking)) return fail(STORAGE_FAIL);
  return { ok: true, data: booking };
}

/** Read access: a renter may only view their own booking; the car's owner may view bookings for their car. */
export function canViewBooking(user: User | null, b: Booking): boolean {
  return !!user && (b.renterId === user.id || b.ownerId === user.id || hasRole(user, "admin"));
}

/* ---------- Reviews ---------- */

export function addReview(actorId: string | null, bookingId: string, rating: number, comment: string): Result<Review> {
  const a = resolveActor(actorId, "renter");
  if (!a.ok) return a;
  const booking = getBooking(bookingId);
  if (!booking) return fail("That booking no longer exists.");
  if (booking.renterId !== a.data.id) return fail(NOT_YOURS);
  if (booking.status !== "completed") return fail(booking.status === "reviewed" ? "You've already reviewed this trip." : "You can review a trip once it's completed.");
  if (getReviews().some((r) => r.bookingId === bookingId)) return fail("You've already reviewed this trip.");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail("Choose a rating from 1 to 5.");
  const text = comment.trim();
  if (text.length < 10) return fail("Please write at least 10 characters.");
  if (text.length > 1000) return fail("Keep your review under 1,000 characters.");
  const review: Review = { id: uid(), bookingId, carId: booking.carId, renterId: booking.renterId, ownerId: booking.ownerId, rating, comment: text, createdAt: new Date().toISOString() };
  if (!saveReview(review)) return fail(STORAGE_FAIL);
  saveBooking({ ...booking, status: "reviewed", updatedAt: review.createdAt });
  return { ok: true, data: review };
}

export function replyToReview(actorId: string | null, reviewId: string, reply: string): Result<Review> {
  const a = resolveActor(actorId, "owner");
  if (!a.ok) return a;
  const review = getReviews().find((r) => r.id === reviewId);
  if (!review) return fail("That review no longer exists.");
  if (review.ownerId !== a.data.id) return fail(NOT_YOURS);
  const text = reply.trim();
  if (!text) return fail("Write a reply first.");
  if (text.length > 500) return fail("Keep replies under 500 characters.");
  const next = { ...review, ownerReply: text };
  return saveReview(next) ? { ok: true, data: next } : fail(STORAGE_FAIL);
}

/* ---------- Disputes ---------- */

export function canViewDispute(user: User | null, d: Dispute): boolean {
  if (!user) return false;
  if (hasRole(user, "admin")) return true;
  const b = getBooking(d.bookingId);
  return !!b && (b.renterId === user.id || b.ownerId === user.id);
}

export function replyToDispute(actorId: string | null, disputeId: string, text: string): Result<Dispute> {
  const a = resolveActor(actorId);
  if (!a.ok) return a;
  const d = getDisputes().find((x) => x.id === disputeId);
  if (!d) return fail("That dispute no longer exists.");
  const b = getBooking(d.bookingId);
  if (!b || (b.renterId !== a.data.id && b.ownerId !== a.data.id)) return fail(NOT_YOURS);
  if (d.status !== "open") return fail("This dispute is already resolved.");
  const t = text.trim();
  if (!t) return fail("Write a message first.");
  if (t.length > 1000) return fail("Keep messages under 1,000 characters.");
  const next: Dispute = { ...d, messages: [...d.messages, { by: a.data.id, text: t, at: new Date().toISOString() }] };
  return saveDispute(next) ? { ok: true, data: next } : fail(STORAGE_FAIL);
}

export function resolveDispute(actorId: string | null, disputeId: string, notes: string): Result<Dispute> {
  const a = resolveActor(actorId, "admin");
  if (!a.ok) return a;
  const d = getDisputes().find((x) => x.id === disputeId);
  if (!d) return fail("That dispute no longer exists.");
  if (d.status !== "open") return fail("This dispute is already resolved.");
  const n = notes.trim();
  if (n.length < 5) return fail("Add resolution notes (at least 5 characters).");
  const now = new Date().toISOString();
  const next: Dispute = { ...d, status: "resolved", resolutionNotes: n, resolvedBy: a.data.id, resolvedAt: now };
  if (!saveDispute(next)) return fail(STORAGE_FAIL);
  const b = getBooking(d.bookingId);
  if (b && b.status === "disputed") saveBooking({ ...b, status: "resolved", updatedAt: now });
  return { ok: true, data: next };
}

/* ---------- Cars (owner) ---------- */

export interface CarInput {
  make: string;
  model: string;
  year: number;
  transmission: Transmission;
  fuel: Fuel;
  seats: number;
  neighbourhood: string;
  pricePerDay: number;
  description: string;
  photos: string[];
}

export const NEIGHBOURHOODS: Record<string, [number, number]> = {
  Bole: [8.9806, 38.7578],
  Piassa: [9.0345, 38.7469],
  CMC: [9.0189, 38.8124],
  Sarbet: [8.9951, 38.7262],
  Kazanchis: [9.0107, 38.7684],
  Megenagna: [9.0204, 38.7989],
  Gerji: [9.0003, 38.807],
  "Old Airport": [8.989, 38.73],
  Lideta: [9.0106, 38.7283],
  Ayat: [9.0228, 38.8662],
};

export const PHOTO_CHOICES = [1, 2, 3, 4, 5, 6].map((n) => `/cars/car-${n}.svg`);

export function validateCarInput(i: CarInput): Record<string, string> {
  const e: Record<string, string> = {};
  const thisYear = new Date().getFullYear();
  if (i.make.trim().length < 2) e.make = "Enter the car's make.";
  if (i.model.trim().length < 1) e.model = "Enter the car's model.";
  if (!Number.isInteger(i.year) || i.year < 1995 || i.year > thisYear + 1) e.year = `Enter a year between 1995 and ${thisYear + 1}.`;
  if (!Number.isInteger(i.seats) || i.seats < 1 || i.seats > 20) e.seats = "Seats must be between 1 and 20.";
  if (!(i.neighbourhood in NEIGHBOURHOODS)) e.neighbourhood = "Choose a neighbourhood.";
  if (!Number.isFinite(i.pricePerDay) || i.pricePerDay < 500 || i.pricePerDay > 50_000) e.pricePerDay = "Daily price must be between ETB 500 and ETB 50,000.";
  if (i.description.trim().length < 20) e.description = "Describe the car in at least 20 characters.";
  if (i.photos.length < 1) e.photos = "Choose at least one demo photo.";
  return e;
}

function buildCar(base: Partial<Car> & { id: string; ownerId: string }, i: CarInput, status: CarStatus): Car {
  const [lat, lng] = NEIGHBOURHOODS[i.neighbourhood] ?? NEIGHBOURHOODS.Bole;
  return {
    unavailableDates: [],
    popularity: 0,
    createdAt: new Date().toISOString(),
    ...base,
    make: i.make.trim(),
    model: i.model.trim(),
    year: i.year,
    transmission: i.transmission,
    fuel: i.fuel,
    seats: i.seats,
    city: "Addis Ababa",
    neighbourhood: i.neighbourhood,
    latitude: lat,
    longitude: lng,
    pricePerDay: Math.round(i.pricePerDay),
    photos: i.photos,
    description: i.description.trim(),
    status,
  };
}

export function createCar(actorId: string | null, input: CarInput, submit: boolean): Result<Car> {
  const a = resolveActor(actorId, "owner");
  if (!a.ok) return a;
  const errs = validateCarInput(input);
  if (Object.keys(errs).length) return fail(Object.values(errs)[0]);
  const car = buildCar({ id: uid(), ownerId: a.data.id }, input, submit ? "pending" : "draft");
  return saveCar(car) ? { ok: true, data: car } : fail(STORAGE_FAIL);
}

export function canManageCar(user: User | null, car: Car | null): boolean {
  return !!user && !!car && hasRole(user, "owner") && car.ownerId === user.id;
}

export function updateCar(actorId: string | null, carId: string, input: CarInput, submit = false): Result<Car> {
  const a = resolveActor(actorId, "owner");
  if (!a.ok) return a;
  const car = getCar(carId);
  if (!car) return fail("That car no longer exists.");
  if (car.ownerId !== a.data.id) return fail(NOT_YOURS);
  const errs = validateCarInput(input);
  if (Object.keys(errs).length) return fail(Object.values(errs)[0]);
  let status: CarStatus = car.status;
  if (submit && (car.status === "draft" || car.status === "rejected")) status = "pending";
  const next = buildCar(car, input, status);
  return saveCar(next) ? { ok: true, data: next } : fail(STORAGE_FAIL);
}

export function setCarActive(actorId: string | null, carId: string, active: boolean): Result<Car> {
  const a = resolveActor(actorId, "owner");
  if (!a.ok) return a;
  const car = getCar(carId);
  if (!car) return fail("That car no longer exists.");
  if (car.ownerId !== a.data.id) return fail(NOT_YOURS);
  if (active && car.status !== "inactive") return fail("Only deactivated listings can be reactivated.");
  if (!active && car.status !== "approved") return fail("Only approved listings can be deactivated.");
  const next: Car = { ...car, status: active ? "approved" : "inactive" };
  return saveCar(next) ? { ok: true, data: next } : fail(STORAGE_FAIL);
}

export function setUnavailableDates(actorId: string | null, carId: string, dates: string[]): Result<Car> {
  const a = resolveActor(actorId, "owner");
  if (!a.ok) return a;
  const car = getCar(carId);
  if (!car) return fail("That car no longer exists.");
  if (car.ownerId !== a.data.id) return fail(NOT_YOURS);
  if (!dates.every(isISODate)) return fail("One of the dates isn't valid.");
  const next: Car = { ...car, unavailableDates: Array.from(new Set(dates)).sort() };
  return saveCar(next) ? { ok: true, data: next } : fail(STORAGE_FAIL);
}

/** Convenience: block/unblock a [start, end] inclusive range. */
export function blockRange(actorId: string | null, carId: string, start: string, end: string, block: boolean): Result<Car> {
  if (!isISODate(start) || !isISODate(end) || end < start) return fail("Choose a valid start and end date.");
  if (daysBetween(start, end) > 366) return fail("Choose a range under a year.");
  const car = getCar(carId);
  if (!car) return fail("That car no longer exists.");
  const range = eachDate(start, addDays(end, 1));
  const set = new Set(car.unavailableDates);
  range.forEach((d) => (block ? set.add(d) : set.delete(d)));
  return setUnavailableDates(actorId, carId, Array.from(set));
}

/* ---------- Admin ---------- */

export function reviewListing(actorId: string | null, carId: string, decision: "approve" | "reject"): Result<Car> {
  const a = resolveActor(actorId, "admin");
  if (!a.ok) return a;
  const car = getCar(carId);
  if (!car) return fail("That car no longer exists.");
  if (car.status !== "pending") return fail("Only pending listings can be reviewed.");
  const next: Car = { ...car, status: decision === "approve" ? "approved" : "rejected" };
  return saveCar(next) ? { ok: true, data: next } : fail(STORAGE_FAIL);
}

export function setUserStatus(actorId: string | null, userId: string, status: "active" | "suspended"): Result<User> {
  const a = resolveActor(actorId, "admin");
  if (!a.ok) return a;
  const u = getUser(userId);
  if (!u) return fail("That user no longer exists.");
  if (u.id === a.data.id) return fail("You can't change your own status.");
  if (hasRole(u, "admin")) return fail("Admin accounts can't be suspended in this demo.");
  const next: User = { ...u, status };
  return saveUser(next) ? { ok: true, data: next } : fail(STORAGE_FAIL);
}

export function createAnnouncement(actorId: string | null, title: string, message: string): Result<Announcement> {
  const a = resolveActor(actorId, "admin");
  if (!a.ok) return a;
  if (title.trim().length < 3) return fail("Add a title (at least 3 characters).");
  if (message.trim().length < 10) return fail("Write a message of at least 10 characters.");
  if (message.length > 500) return fail("Keep announcements under 500 characters.");
  const ann: Announcement = { id: uid(), title: title.trim(), message: message.trim(), active: true, createdAt: new Date().toISOString(), createdBy: a.data.id };
  return saveAnnouncement(ann) ? { ok: true, data: ann } : fail(STORAGE_FAIL);
}

export function setAnnouncementActive(actorId: string | null, id: string, active: boolean): Result<Announcement> {
  const a = resolveActor(actorId, "admin");
  if (!a.ok) return a;
  const ann = getAnnouncements().find((x) => x.id === id);
  if (!ann) return fail("That announcement no longer exists.");
  const next = { ...ann, active };
  return saveAnnouncement(next) ? { ok: true, data: next } : fail(STORAGE_FAIL);
}

// Re-exports used by the "negative test" page.
export { getUsers, getCars };
