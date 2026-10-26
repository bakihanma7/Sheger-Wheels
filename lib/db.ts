import type { Announcement, Booking, Car, Dispute, Review, User } from "./types";
import { KEYS, SESSION_KEYS, isArrayOfRecords, readRaw, readStorage, removeStorage, writeStorage } from "./storage";
import { seedAnnouncements, seedBookings, seedCars, seedDisputes, seedReviews, seedUsers } from "./seed";

/** Data-access module: every component and domain function reads/writes through these. */

export const getUsers = (): User[] => readStorage<User[]>(KEYS.users, [], isArrayOfRecords<User>);
export const getCars = (): Car[] => readStorage<Car[]>(KEYS.cars, [], isArrayOfRecords<Car>);
export const getBookings = (): Booking[] => readStorage<Booking[]>(KEYS.bookings, [], isArrayOfRecords<Booking>);
export const getReviews = (): Review[] => readStorage<Review[]>(KEYS.reviews, [], isArrayOfRecords<Review>);
export const getDisputes = (): Dispute[] => readStorage<Dispute[]>(KEYS.disputes, [], isArrayOfRecords<Dispute>);
export const getAnnouncements = (): Announcement[] =>
  readStorage<Announcement[]>(KEYS.announcements, [], isArrayOfRecords<Announcement>);

export const getUser = (id: string) => getUsers().find((u) => u.id === id) ?? null;
export const getCar = (id: string) => getCars().find((c) => c.id === id) ?? null;
export const getBooking = (id: string) => getBookings().find((b) => b.id === id) ?? null;

function upsert<T extends { id: string }>(key: string, all: T[], item: T): boolean {
  const i = all.findIndex((x) => x.id === item.id);
  const next = i === -1 ? [...all, item] : all.map((x, idx) => (idx === i ? item : x));
  return writeStorage(key, next);
}

export const saveUser = (u: User) => upsert(KEYS.users, getUsers(), u);
export const saveCar = (c: Car) => upsert(KEYS.cars, getCars(), c);
export const saveBooking = (b: Booking) => upsert(KEYS.bookings, getBookings(), b);
export const saveReview = (r: Review) => upsert(KEYS.reviews, getReviews(), r);
export const saveDispute = (d: Dispute) => upsert(KEYS.disputes, getDisputes(), d);
export const saveAnnouncement = (a: Announcement) => upsert(KEYS.announcements, getAnnouncements(), a);

const SEEDERS: [string, () => unknown][] = [
  [KEYS.users, () => seedUsers()],
  [KEYS.cars, () => seedCars()],
  [KEYS.bookings, () => seedBookings()],
  [KEYS.reviews, () => seedReviews()],
  [KEYS.disputes, () => seedDisputes()],
  [KEYS.announcements, () => seedAnnouncements()],
];

/** Seeds each key only when it is ABSENT; never overwrites existing user data on refresh. */
export function initializeDemoData(): void {
  for (const [key, make] of SEEDERS) {
    if (readRaw(key) === null) writeStorage(key, make());
  }
}

/** Dev/demo control: restores seed data and signs everyone out. */
export function resetDemoData(): void {
  for (const [key, make] of SEEDERS) writeStorage(key, make());
  for (const k of SESSION_KEYS) removeStorage(k, "session");
}
