/**
 * Demo-grade password hashing with the Web Crypto API (PBKDF2-SHA256, random salt).
 * It stops passwords sitting in storage as plain text. It is NOT real account security: the hash lives in
 * the same browser storage the user (or anyone with dev tools) can edit. See AUTH.md.
 */
const ITERATIONS = 100_000;

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function newSalt(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(16)).buffer as ArrayBuffer);
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: ITERATIONS }, key, 256);
  return toHex(bits);
}

export async function createCredential(password: string): Promise<{ passwordSalt: string; passwordHash: string }> {
  const passwordSalt = newSalt();
  return { passwordSalt, passwordHash: await hashPassword(password, passwordSalt) };
}

export async function verifyPassword(password: string, salt: string, hash: string): Promise<boolean> {
  const h = await hashPassword(password, salt);
  if (h.length !== hash.length) return false;
  let diff = 0; // compare every character, no early exit
  for (let i = 0; i < h.length; i++) diff |= h.charCodeAt(i) ^ hash.charCodeAt(i);
  return diff === 0;
}
