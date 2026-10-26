/** crypto.randomUUID() when available, small fallback otherwise. */
export function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** A clearly fake TeleBirr-style reference. Never a real transaction id. */
export function demoPaymentRef(): string {
  const n = Math.floor(10_000_000 + Math.random() * 89_999_999);
  return `TB-DEMO-${n}`;
}
