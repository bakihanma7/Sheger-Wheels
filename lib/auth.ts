import type { Result, Role, SessionData, User } from "./types";
import { KEYS, SESSION_KEYS, readStorage, removeStorage, writeStorage } from "./storage";
import { getUser, getUsers, saveUser } from "./db";
import { verifyPassword } from "./password";
import { DEMO_PASSWORD } from "./seed";
import { uid } from "./id";

/**
 * DEMO AUTH. Passwords are checked against a salted hash kept in browser storage (or the published demo
 * password for seeded accounts). Only the signed-in user's id lives in sessionStorage and the user record
 * is looked up from localStorage. Anyone can edit browser storage, so these checks show
 * front-end design only; they are NOT real security. See AUTH.md.
 */

export const NOT_SIGNED_IN = "Not signed in";
export const NOT_YOURS = "Not yours";
export const SUSPENDED_MSG = "This account is suspended. Demo actions are disabled.";

function isSession(v: unknown): v is SessionData {
  return typeof v === "object" && v !== null && typeof (v as SessionData).userId === "string";
}

export function getCurrentSession(): SessionData | null {
  return readStorage<SessionData | null>(KEYS.session, null, (v): v is SessionData | null => v === null || isSession(v), "session");
}

export function getCurrentUser(): User | null {
  const s = getCurrentSession();
  return s ? getUser(s.userId) : null;
}

export function signInAsDemo(userId: string): Result<User> {
  const user = getUser(userId);
  if (!user) return { ok: false, error: "That demo account doesn't exist." };
  writeStorage(KEYS.session, { userId: user.id, signedInAt: new Date().toISOString() } satisfies SessionData, "session");
  return { ok: true, data: user };
}

/** Normalises a phone number to its last 9 digits so "+251 91 234 5678" and "0912345678" match. */
function phoneKey(v: string): string {
  return v.replace(/\D/g, "").slice(-9);
}

/** Finds an account by email (case-insensitive) or phone number. */
export function findUserByIdentifier(identifier: string): User | null {
  const raw = identifier.trim();
  if (!raw) return null;
  if (raw.includes("@")) return getUsers().find((u) => u.email.toLowerCase() === raw.toLowerCase()) ?? null;
  const key = phoneKey(raw);
  if (key.length < 7) return null;
  return getUsers().find((u) => phoneKey(u.phone) === key) ?? null;
}

export function validateIdentifier(identifier: string): string | null {
  const raw = identifier.trim();
  if (!raw) return "Enter your email or phone number.";
  if (raw.includes("@")) return /^\S+@\S+\.\S+$/.test(raw) ? null : "Enter a valid email address.";
  return /^\+?[0-9 ()-]{7,20}$/.test(raw) ? null : "Enter a valid phone number or email address.";
}

/** Where a signed-in user should land by default. */
export function landingFor(u: User): string {
  if (u.roles.includes("admin")) return "/admin";
  if (!u.roles.includes("renter") && u.roles.includes("owner")) return "/owner";
  return "/dashboard";
}

/**
 * Demo password sign-in. The same message is returned for an unknown account and a wrong password,
 * so the form doesn't reveal which accounts exist.
 */
export async function signInWithPassword(identifier: string, password: string): Promise<Result<User>> {
  const bad: Result<User> = { ok: false, error: "That email/phone and password don't match." };
  const idErr = validateIdentifier(identifier);
  if (idErr) return { ok: false, error: idErr };
  if (!password) return { ok: false, error: "Enter your password." };
  const user = findUserByIdentifier(identifier);
  if (!user) return bad;
  let ok = false;
  if (user.passwordHash && user.passwordSalt) ok = await verifyPassword(password, user.passwordSalt, user.passwordHash);
  else if (user.email.endsWith("@demo.sheggar.test")) ok = password === DEMO_PASSWORD; // seeded demo accounts only
  return ok ? signInAsDemo(user.id) : bad;
}

/** Mock sign-in by email only (kept for tests and the quick demo shortcut; no password check). */
export function signInWithEmail(email: string): Result<User> {
  const clean = email.trim().toLowerCase();
  if (!clean) return { ok: false, error: "Enter your email address." };
  if (!/^\S+@\S+\.\S+$/.test(clean)) return { ok: false, error: "Enter a valid email address." };
  const user = getUsers().find((u) => u.email.toLowerCase() === clean);
  if (!user) return { ok: false, error: "No demo account uses that email. Try a demo account below, or create one." };
  return signInAsDemo(user.id);
}

export function signOut(): void {
  for (const k of SESSION_KEYS) removeStorage(k, "session");
}

export function hasRole(user: User | null | undefined, role: Role): boolean {
  return !!user && user.roles.includes(role);
}

export function isSuspended(user: User | null | undefined): boolean {
  return !!user && user.status === "suspended";
}

/** Resolves an acting user id into a usable, non-suspended user, or a clear refusal. */
export function resolveActor(actorId: string | null | undefined, role?: Role): Result<User> {
  if (!actorId) return { ok: false, error: NOT_SIGNED_IN };
  const user = getUser(actorId);
  if (!user) return { ok: false, error: NOT_SIGNED_IN };
  if (isSuspended(user)) return { ok: false, error: SUSPENDED_MSG };
  if (role && !hasRole(user, role)) return { ok: false, error: `This action needs the ${role} role.` };
  return { ok: true, data: user };
}

export const requireRole = resolveActor;

/**
 * Only same-site relative paths are allowed ("/dashboard?x=1"). Anything else, including
 * "https://example.com", "//evil.com", "/\\evil.com", "javascript:..." falls back to `fallback`.
 */
export function safeReturnPath(value: string | null | undefined, fallback = "/"): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 500) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    const u = new URL(value, "http://sheggar.invalid");
    if (u.origin !== "http://sheggar.invalid") return fallback;
  } catch {
    return fallback;
  }
  if (value.startsWith("/signin") || value.startsWith("/signup")) return fallback;
  return value;
}

export type AccountType = "owner" | "renter" | "both";

export interface SignUpInput {
  name: string;
  email: string;
  phone: string;
  accountType: AccountType;
  /** From createCredential() in lib/password.ts. The plain password is never passed in or stored. */
  passwordSalt?: string;
  passwordHash?: string;
}

/* Per-field validators, shared by the step-by-step sign-up wizard and the final check. */
export function validateName(name: string): string | null {
  return name.trim().length < 2 ? "Enter your full name." : null;
}
export function validateEmail(email: string): string | null {
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Enter a valid email address.";
  if (getUsers().some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) return "That email is already used by a demo account.";
  return null;
}
export function validatePhone(phone: string): string | null {
  return /^\+?[0-9 ()-]{7,20}$/.test(phone.trim()) ? null : "Enter a phone number, e.g. +251 91 234 5678.";
}
/** Demo rule only. The password is checked for shape, then discarded: this demo has no password sign-in and never stores one. */
export function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Use at least 8 characters.";
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return "Include at least one letter and one number.";
  return null;
}
export function validateConfirmPassword(pw: string, confirm: string): string | null {
  return pw === confirm ? null : "The passwords don't match.";
}
export function rolesFor(t: AccountType): Role[] {
  return t === "owner" ? ["owner"] : t === "both" ? ["renter", "owner"] : ["renter"];
}
/** Where a freshly created account should land. */
export function homeFor(t: AccountType): string {
  return t === "owner" ? "/owner" : "/dashboard";
}

export function validateSignUp(input: SignUpInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const n = validateName(input.name); if (n) errors.name = n;
  const e = validateEmail(input.email); if (e) errors.email = e;
  const p = validatePhone(input.phone); if (p) errors.phone = p;
  if (!["owner", "renter", "both"].includes(input.accountType)) errors.accountType = "Choose how you'll use Sheggar Wheels.";
  return errors;
}

/** Creates a demo account. The admin role can never be chosen here. */
export function signUp(input: SignUpInput): Result<User> {
  const errors = validateSignUp(input);
  if (Object.keys(errors).length) return { ok: false, error: Object.values(errors)[0] };
  const roles: Role[] = rolesFor(input.accountType);
  const user: User = {
    id: uid(),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    roles,
    status: "active",
    createdAt: new Date().toISOString(),
    ...(input.passwordHash && input.passwordSalt ? { passwordSalt: input.passwordSalt, passwordHash: input.passwordHash } : {}),
  };
  if (!saveUser(user)) return { ok: false, error: "Couldn't save your demo account because browser storage is unavailable." };
  return signInAsDemo(user.id);
}
