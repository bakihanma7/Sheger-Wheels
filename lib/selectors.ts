import type { Announcement, Booking, BookingStatus, Car, Dispute, Review, User } from "./types";
import { isCarAvailable, isCarPublic } from "./domain";
import { addDays, formatETB, todayISO } from "./format";

/* ---------- Catalogue search / filter / sort / paginate ---------- */

export type SortKey = "popularity" | "price-asc" | "price-desc" | "newest";
export const PAGE_SIZE = 6;

export interface CatalogueQuery {
  q: string;
  neighbourhood: string;
  minPrice: number | null;
  maxPrice: number | null;
  transmission: "" | "Automatic" | "Manual";
  minSeats: number | null;
  start: string;
  end: string;
  sort: SortKey;
  page: number;
}

const num = (v: string | null): number | null => {
  if (v === null || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export function parseCatalogueQuery(p: URLSearchParams): CatalogueQuery {
  const sort = p.get("sort");
  const trans = p.get("transmission");
  const page = Math.floor(Number(p.get("page")));
  return {
    q: (p.get("q") ?? "").trim(),
    neighbourhood: p.get("neighbourhood") ?? "",
    minPrice: num(p.get("minPrice")),
    maxPrice: num(p.get("maxPrice")),
    transmission: trans === "Automatic" || trans === "Manual" ? trans : "",
    minSeats: num(p.get("minSeats")),
    start: p.get("start") ?? "",
    end: p.get("end") ?? "",
    sort: sort === "price-asc" || sort === "price-desc" || sort === "newest" || sort === "popularity" ? sort : "popularity",
    page: Number.isFinite(page) && page >= 1 ? page : 1,
  };
}

export function catalogueQueryToParams(q: Partial<CatalogueQuery>): URLSearchParams {
  const p = new URLSearchParams();
  if (q.q) p.set("q", q.q);
  if (q.neighbourhood) p.set("neighbourhood", q.neighbourhood);
  if (q.minPrice !== null && q.minPrice !== undefined) p.set("minPrice", String(q.minPrice));
  if (q.maxPrice !== null && q.maxPrice !== undefined) p.set("maxPrice", String(q.maxPrice));
  if (q.transmission) p.set("transmission", q.transmission);
  if (q.minSeats !== null && q.minSeats !== undefined) p.set("minSeats", String(q.minSeats));
  if (q.start) p.set("start", q.start);
  if (q.end) p.set("end", q.end);
  if (q.sort && q.sort !== "popularity") p.set("sort", q.sort);
  if (q.page && q.page > 1) p.set("page", String(q.page));
  return p;
}

export function filterCars(cars: Car[], bookings: Booking[], q: CatalogueQuery): Car[] {
  const needle = q.q.toLowerCase();
  const out = cars.filter((c) => {
    if (!isCarPublic(c)) return false; // only approved cars appear publicly
    if (needle && !`${c.make} ${c.model} ${c.description}`.toLowerCase().includes(needle)) return false;
    if (q.neighbourhood && c.neighbourhood !== q.neighbourhood && c.city !== q.neighbourhood) return false;
    if (q.minPrice !== null && c.pricePerDay < q.minPrice) return false;
    if (q.maxPrice !== null && c.pricePerDay > q.maxPrice) return false;
    if (q.transmission && c.transmission !== q.transmission) return false;
    if (q.minSeats !== null && c.seats < q.minSeats) return false;
    if (q.start && q.end && !isCarAvailable(c, q.start, q.end, bookings)) return false;
    return true;
  });
  const sorters: Record<SortKey, (a: Car, b: Car) => number> = {
    "price-asc": (a, b) => a.pricePerDay - b.pricePerDay,
    "price-desc": (a, b) => b.pricePerDay - a.pricePerDay,
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    popularity: (a, b) => b.popularity - a.popularity,
  };
  return out.sort(sorters[q.sort]);
}

export function paginate<T>(items: T[], page: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), pages); // clamp so the user never lands on an empty page
  return { items: items.slice((current - 1) * size, current * size), page: current, pages, total: items.length };
}

/* ---------- Ratings ---------- */

export function carRating(carId: string, reviews: Review[]): { average: number | null; count: number } {
  const rs = reviews.filter((r) => r.carId === carId);
  if (!rs.length) return { average: null, count: 0 };
  return { average: rs.reduce((s, r) => s + r.rating, 0) / rs.length, count: rs.length };
}

export function tripCount(carId: string, bookings: Booking[]): number {
  return bookings.filter((b) => b.carId === carId && ["completed", "reviewed", "resolved"].includes(b.status)).length;
}

/* ---------- Dashboards ---------- */

export const FINISHED: BookingStatus[] = ["completed", "reviewed", "resolved"];
export const UPCOMING: BookingStatus[] = ["requested", "confirmed"];

export function renterStats(bookings: Booking[], userId: string) {
  const mine = bookings.filter((b) => b.renterId === userId);
  const today = todayISO();
  const upcoming = mine.filter((b) => (UPCOMING.includes(b.status) || b.status === "in_progress") && b.endDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate));
  return {
    mine,
    upcoming,
    nextBooking: upcoming[0] ?? null,
    completedCount: mine.filter((b) => FINISHED.includes(b.status)).length,
    cancelledCount: mine.filter((b) => b.status === "cancelled").length,
    totalSpend: mine.filter((b) => b.paymentStatus === "paid").reduce((s, b) => s + b.total, 0),
    activeNow: mine.find((b) => b.status === "in_progress") ?? null,
  };
}

export function ownerStats(cars: Car[], bookings: Booking[], ownerId: string) {
  const myCars = cars.filter((c) => c.ownerId === ownerId);
  const mine = bookings.filter((b) => b.ownerId === ownerId);
  const earned = mine.filter((b) => FINISHED.includes(b.status));
  const byMonth = new Map<string, number>();
  earned.forEach((b) => byMonth.set(b.startDate.slice(0, 7), (byMonth.get(b.startDate.slice(0, 7)) ?? 0) + b.subtotal));
  const months = Array.from(byMonth.keys()).sort();
  return {
    myCars,
    mine,
    approvedCars: myCars.filter((c) => c.status === "approved").length,
    pendingRequests: mine.filter((b) => b.status === "requested").length,
    confirmedRentals: mine.filter((b) => b.status === "confirmed" || b.status === "in_progress").length,
    totalEarnings: earned.reduce((s, b) => s + b.subtotal, 0),
    earningsByMonth: months.map((m) => ({ month: m, earnings: byMonth.get(m) ?? 0 })),
    utilization: myCars.map((c) => utilizationForCar(c, mine)),
  };
}

/** Share of the last 30 days a car was booked (confirmed, in progress or finished). */
export function utilizationForCar(car: Car, bookings: Booking[], windowDays = 30) {
  const end = todayISO();
  const start = addDays(end, -windowDays);
  const used = new Set<string>();
  bookings
    .filter((b) => b.carId === car.id && ["confirmed", "in_progress", ...FINISHED].includes(b.status))
    .forEach((b) => {
      for (let d = b.startDate < start ? start : b.startDate; d < b.endDate && d < end; d = addDays(d, 1)) used.add(d);
    });
  return { carId: car.id, name: `${car.make} ${car.model}`, bookedDays: used.size, windowDays, percent: Math.round((used.size / windowDays) * 100) };
}

export function adminStats(users: User[], cars: Car[], bookings: Booking[], disputes: Dispute[]) {
  const byStatus = new Map<string, number>();
  bookings.forEach((b) => byStatus.set(b.status, (byStatus.get(b.status) ?? 0) + 1));
  const volumeByMonth = new Map<string, number>();
  bookings.filter((b) => b.paymentStatus === "paid").forEach((b) => volumeByMonth.set(b.startDate.slice(0, 7), (volumeByMonth.get(b.startDate.slice(0, 7)) ?? 0) + b.total));
  return {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.status === "active").length,
    approvedCars: cars.filter((c) => c.status === "approved").length,
    pendingCars: cars.filter((c) => c.status === "pending").length,
    openDisputes: disputes.filter((d) => d.status === "open").length,
    platformFee: bookings.filter((b) => b.paymentStatus === "paid").reduce((s, b) => s + b.fee, 0),
    bookingVolume: bookings.filter((b) => b.paymentStatus === "paid").reduce((s, b) => s + b.total, 0),
    byStatus: Array.from(byStatus, ([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
    volumeByMonth: Array.from(volumeByMonth, ([month, volume]) => ({ month, volume })).sort((a, b) => a.month.localeCompare(b.month)),
  };
}

/* ---------- Simulated notifications (derived from records; no server events) ---------- */

export interface AppNotification {
  id: string;
  text: string;
  at: string;
  href: string;
}

export function deriveNotifications(user: User, cars: Car[], bookings: Booking[], disputes: Dispute[]): AppNotification[] {
  const carName = (id: string) => {
    const c = cars.find((x) => x.id === id);
    return c ? `${c.make} ${c.model}` : "a car";
  };
  const out: AppNotification[] = [];
  if (user.roles.includes("renter")) {
    bookings
      .filter((b) => b.renterId === user.id)
      .forEach((b) => {
        const href = `/bookings/${b.id}`;
        if (b.status === "confirmed") out.push({ id: `n-${b.id}-c`, text: `Your request for the ${carName(b.carId)} was approved.`, at: b.updatedAt, href });
        if (b.status === "declined") out.push({ id: `n-${b.id}-d`, text: `The owner declined your request for the ${carName(b.carId)}. Your demo payment was refunded.`, at: b.updatedAt, href });
        if (b.status === "completed") out.push({ id: `n-${b.id}-r`, text: `How was the ${carName(b.carId)}? Leave a review.`, at: b.updatedAt, href: `/bookings/${b.id}/review` });
        if (b.status === "in_progress") out.push({ id: `n-${b.id}-t`, text: `Your trip in the ${carName(b.carId)} is under way (simulation).`, at: b.updatedAt, href: `/bookings/${b.id}/track` });
      });
  }
  if (user.roles.includes("owner")) {
    bookings
      .filter((b) => b.ownerId === user.id && b.status === "requested")
      .forEach((b) => out.push({ id: `n-${b.id}-q`, text: `New request for your ${carName(b.carId)}.`, at: b.createdAt, href: `/owner/cars/${b.carId}/bookings` }));
    cars.filter((c) => c.ownerId === user.id && c.status === "rejected").forEach((c) => out.push({ id: `n-${c.id}-x`, text: `Your ${c.make} ${c.model} listing was rejected. Edit it and resubmit.`, at: c.createdAt, href: `/owner/cars/${c.id}/edit` }));
    cars.filter((c) => c.ownerId === user.id && c.status === "approved" && Date.now() - new Date(c.createdAt).getTime() < 7 * 86_400_000).forEach((c) => out.push({ id: `n-${c.id}-a`, text: `Your ${c.make} ${c.model} is live.`, at: c.createdAt, href: `/owner/cars` }));
  }
  if (user.roles.includes("admin")) {
    cars.filter((c) => c.status === "pending").forEach((c) => out.push({ id: `n-${c.id}-p`, text: `${c.make} ${c.model} is waiting for review.`, at: c.createdAt, href: "/admin/listings" }));
    disputes.filter((d) => d.status === "open").forEach((d) => out.push({ id: `n-${d.id}-o`, text: `Open dispute: ${d.reason}.`, at: d.createdAt, href: `/admin/disputes/${d.id}` }));
  }
  return out.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
}

export function activeAnnouncements(a: Announcement[]): Announcement[] {
  return a.filter((x) => x.active).sort((x, y) => y.createdAt.localeCompare(x.createdAt));
}

export const priceLabel = (c: Car) => `${formatETB(c.pricePerDay)} / day`;
export const carTitle = (c: Pick<Car, "make" | "model" | "year">) => `${c.make} ${c.model} ${c.year}`;
