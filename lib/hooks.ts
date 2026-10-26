"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Announcement, Booking, Car, CheckoutDraft, Dispute, Review, SessionData, User } from "./types";
import { KEYS, isArrayOfRecords, parseStored, readRaw, subscribeToStorageChanges, type StorageArea } from "./storage";

/**
 * SWR-style hooks without a dependency: components subscribe to a storage key and re-render when it
 * changes (same tab via our emitter, other tabs via the native `storage` event).
 * The server snapshot is always the fallback, so SSR/hydration output is deterministic; real data
 * appears right after hydration.
 */

const cache = new Map<string, { raw: string | null; value: unknown }>();

function snapshotFor<T>(key: string, fallback: T, area: StorageArea, validate?: (v: unknown) => v is T): T {
  const raw = readRaw(key, area);
  const ck = `${area}:${key}`;
  const hit = cache.get(ck);
  if (hit && hit.raw === raw) return hit.value as T;
  const value = raw === null ? fallback : parseStored(key, raw, fallback, validate);
  cache.set(ck, { raw, value });
  return value;
}

function useStored<T>(key: string, fallback: T, area: StorageArea, validate?: (v: unknown) => v is T): T {
  const get = useCallback(() => snapshotFor(key, fallback, area, validate), [key, fallback, area, validate]);
  const getServer = useCallback(() => fallback, [fallback]);
  return useSyncExternalStore(subscribeToStorageChanges, get, getServer);
}

/** false during SSR + first client render, true afterwards. Lets pages tell "loading" from "empty". */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

const NO_USERS: User[] = [];
const NO_CARS: Car[] = [];
const NO_BOOKINGS: Booking[] = [];
const NO_REVIEWS: Review[] = [];
const NO_DISPUTES: Dispute[] = [];
const NO_ANNOUNCEMENTS: Announcement[] = [];

const arr = <T,>() => isArrayOfRecords<T>;
const vUsers = arr<User>();
const vCars = arr<Car>();
const vBookings = arr<Booking>();
const vReviews = arr<Review>();
const vDisputes = arr<Dispute>();
const vAnnouncements = arr<Announcement>();

export const useUsers = () => useStored(KEYS.users, NO_USERS, "local", vUsers);
export const useCars = () => useStored(KEYS.cars, NO_CARS, "local", vCars);
export const useBookings = () => useStored(KEYS.bookings, NO_BOOKINGS, "local", vBookings);
export const useReviews = () => useStored(KEYS.reviews, NO_REVIEWS, "local", vReviews);
export const useDisputes = () => useStored(KEYS.disputes, NO_DISPUTES, "local", vDisputes);
export const useAnnouncements = () => useStored(KEYS.announcements, NO_ANNOUNCEMENTS, "local", vAnnouncements);

const isSessionOrNull = (v: unknown): v is SessionData | null => v === null || (typeof v === "object" && v !== null && typeof (v as SessionData).userId === "string");
const isDraftOrNull = (v: unknown): v is CheckoutDraft | null => v === null || (typeof v === "object" && v !== null && typeof (v as CheckoutDraft).carId === "string");

export const useCheckoutDraft = () => useStored<CheckoutDraft | null>(KEYS.checkoutDraft, null, "session", isDraftOrNull);

export type SessionState =
  | { status: "loading"; user: null }
  | { status: "signed-out"; user: null }
  | { status: "signed-in"; user: User };

export function useSession(): SessionState {
  const hydrated = useHydrated();
  const session = useStored<SessionData | null>(KEYS.session, null, "session", isSessionOrNull);
  const users = useUsers();
  if (!hydrated) return { status: "loading", user: null };
  if (!session) return { status: "signed-out", user: null };
  const user = users.find((u) => u.id === session.userId);
  // Users load right after hydration; a missing user with an empty list is still "loading".
  if (!user) return users.length === 0 ? { status: "loading", user: null } : { status: "signed-out", user: null };
  return { status: "signed-in", user };
}
