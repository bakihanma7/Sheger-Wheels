const etb = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** Ethiopian birr, e.g. "ETB 3,500". Rounded to whole birr. */
export function formatETB(amount: number): string {
  return `ETB ${etb.format(Math.round(amount))}`;
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** Accepts "YYYY-MM-DD" or a full ISO timestamp. */
export function formatDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  return Number.isNaN(d.getTime()) ? iso : dateFmt.format(d);
}

export function formatDateRange(start: string, end: string): string {
  return `${formatDate(start)} → ${formatDate(end)}`;
}

export function relativeTime(iso: string, now: Date = new Date()): string {
  const diff = now.getTime() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return iso;
  const s = Math.round(Math.abs(diff) / 1000);
  const future = diff < 0;
  const units: [number, string][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [30, "day"],
    [12, "month"],
    [Infinity, "year"],
  ];
  let value = s;
  let unit = "second";
  for (const [size, name] of units) {
    unit = name;
    if (value < size) break;
    value = Math.floor(value / size);
  }
  if (s < 10) return "just now";
  const label = `${value} ${unit}${value === 1 ? "" : "s"}`;
  return future ? `in ${label}` : `${label} ago`;
}

export function todayISO(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Whole days between two YYYY-MM-DD dates (end exclusive). */
export function daysBetween(start: string, end: string): number {
  const a = new Date(`${start}T00:00:00Z`).getTime();
  const b = new Date(`${end}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function isISODate(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

/** Every date in [start, end) as YYYY-MM-DD. */
export function eachDate(start: string, end: string): string[] {
  const out: string[] = [];
  for (let i = 0, n = daysBetween(start, end); i < n; i++) out.push(addDays(start, i));
  return out;
}

export function titleCase(s: string): string {
  return s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}
