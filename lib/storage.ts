/**
 * Browser-storage data layer. Runs ONLY in the browser: localStorage/sessionStorage do not exist
 * on the server, so every read is guarded and returns the fallback during SSR.
 *
 * - readStorage / writeStorage: safe JSON helpers (never throw).
 * - A tiny pub-sub + the native `storage` event drive useSyncExternalStore hooks (see lib/hooks.ts).
 */

export type StorageArea = "local" | "session";

export const KEYS = {
  users: "sw_users_v1",
  cars: "sw_cars_v1",
  bookings: "sw_bookings_v1",
  reviews: "sw_reviews_v1",
  disputes: "sw_disputes_v1",
  announcements: "sw_announcements_v1",
  session: "sw_session_v1", // sessionStorage
  checkoutDraft: "sw_checkout_draft_v1", // sessionStorage
} as const;

export const SESSION_KEYS: string[] = [KEYS.session, KEYS.checkoutDraft];

type Listener = () => void;
const listeners = new Set<Listener>();
let lastError: string | null = null;

export function getStorageError(): string | null {
  return lastError;
}

function area(a: StorageArea): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return a === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    // Storage can be blocked (private mode, cookies disabled).
    return null;
  }
}

export function subscribeToStorageChanges(listener: Listener): () => void {
  listeners.add(listener);
  const onStorage = () => listener();
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

function emit() {
  listeners.forEach((l) => l());
}

export function readRaw(key: string, a: StorageArea = "local"): string | null {
  const s = area(a);
  if (!s) return null;
  try {
    return s.getItem(key);
  } catch {
    return null;
  }
}

/** Reads + parses JSON. Missing, malformed or invalid data returns `fallback` (and records an error message). */
export function readStorage<T>(key: string, fallback: T, validate?: (v: unknown) => v is T, a: StorageArea = "local"): T {
  const raw = readRaw(key, a);
  if (raw === null) return fallback;
  return parseStored(key, raw, fallback, validate);
}

export function parseStored<T>(key: string, raw: string, fallback: T, validate?: (v: unknown) => v is T): T {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (validate && !validate(parsed)) {
      lastError = `Saved data for "${key}" had an unexpected shape, so demo defaults are being used.`;
      return fallback;
    }
    return parsed as T;
  } catch {
    lastError = `Saved data for "${key}" could not be read (malformed JSON). Use "Reset demo data" to recover.`;
    return fallback;
  }
}

/** Serialises + saves. Returns false (never throws) on quota/blocked-storage errors. */
export function writeStorage(key: string, value: unknown, a: StorageArea = "local"): boolean {
  const s = area(a);
  if (!s) {
    lastError = "Browser storage is unavailable, so changes can't be saved.";
    return false;
  }
  try {
    s.setItem(key, JSON.stringify(value));
    emit();
    return true;
  } catch {
    lastError = "Browser storage is full or blocked, so changes couldn't be saved.";
    return false;
  }
}

export function removeStorage(key: string, a: StorageArea = "local"): void {
  const s = area(a);
  if (!s) return;
  try {
    s.removeItem(key);
  } catch {
    /* ignore */
  }
  emit();
}

export function isArrayOfRecords<T>(v: unknown): v is T[] {
  return Array.isArray(v) && v.every((x) => typeof x === "object" && x !== null && typeof (x as { id?: unknown }).id === "string");
}
