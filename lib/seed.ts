import type { Announcement, Booking, Car, Dispute, Review, User } from "./types";
import { addDays, daysBetween, todayISO } from "./format";

/** All seed data is fictional. Ids are stable so seeded car pages can be pre-rendered. */
export const DEMO_IDS = {
  ownerSelam: "u-selam",
  ownerDawit: "u-dawit",
  renterHana: "u-hana",
  renterYonas: "u-yonas",
  suspendedMekdes: "u-mekdes",
  admin: "u-admin",
} as const;

export const FEE_RATE = 0.08;
/** Published on the sign-in page. Seeded demo accounts have no stored hash and accept only this. */
export const DEMO_PASSWORD = "Demo1234";

export function seedUsers(now = new Date()): User[] {
  const created = new Date(now.getTime() - 90 * 86_400_000).toISOString();
  return [
    { id: DEMO_IDS.ownerSelam, name: "Selam Bekele", email: "selam@demo.sheggar.test", phone: "+251 91 100 0001", roles: ["renter", "owner"], status: "active", createdAt: created },
    { id: DEMO_IDS.ownerDawit, name: "Dawit Tadesse", email: "dawit@demo.sheggar.test", phone: "+251 91 100 0002", roles: ["renter", "owner"], status: "active", createdAt: created },
    { id: DEMO_IDS.renterHana, name: "Hana Alemu", email: "hana@demo.sheggar.test", phone: "+251 91 100 0003", roles: ["renter"], status: "active", createdAt: created },
    { id: DEMO_IDS.renterYonas, name: "Yonas Girma", email: "yonas@demo.sheggar.test", phone: "+251 91 100 0004", roles: ["renter"], status: "active", createdAt: created },
    { id: DEMO_IDS.suspendedMekdes, name: "Mekdes Haile", email: "mekdes@demo.sheggar.test", phone: "+251 91 100 0005", roles: ["renter"], status: "suspended", createdAt: created },
    { id: DEMO_IDS.admin, name: "Demo Admin", email: "admin@demo.sheggar.test", phone: "+251 91 100 0006", roles: ["admin"], status: "active", createdAt: created },
  ];
}

type CarSeed = Omit<Car, "createdAt" | "photos" | "unavailableDates" | "city"> & { photoIdx: number; unavailableOffsets?: number[] };

const CARS: CarSeed[] = [
  { id: "car-corolla-bole", ownerId: DEMO_IDS.ownerSelam, make: "Toyota", model: "Corolla", year: 2020, transmission: "Automatic", fuel: "Petrol", seats: 5, neighbourhood: "Bole", latitude: 8.9806, longitude: 38.7578, pricePerDay: 2800, description: "A reliable, fuel-efficient city sedan. Clean interior, working AC, and easy pickup near Bole Medhanialem.", status: "approved", popularity: 92, photoIdx: 1, unavailableOffsets: [40, 41] },
  { id: "car-vitz-piassa", ownerId: DEMO_IDS.ownerSelam, make: "Toyota", model: "Vitz", year: 2017, transmission: "Manual", fuel: "Petrol", seats: 4, neighbourhood: "Piassa", latitude: 9.0345, longitude: 38.7469, pricePerDay: 1800, description: "A small, nimble hatchback that is easy to park in the old city. Great for tight streets and short trips.", status: "approved", popularity: 61, photoIdx: 2 },
  { id: "car-rav4-cmc", ownerId: DEMO_IDS.ownerSelam, make: "Toyota", model: "RAV4", year: 2021, transmission: "Automatic", fuel: "Hybrid", seats: 5, neighbourhood: "CMC", latitude: 9.0189, longitude: 38.8124, pricePerDay: 5200, description: "Comfortable hybrid SUV with plenty of boot space, ideal for weekend trips out of the city.", status: "approved", popularity: 88, photoIdx: 3 },
  { id: "car-hilux-kazanchis", ownerId: DEMO_IDS.ownerDawit, make: "Toyota", model: "Hilux", year: 2019, transmission: "Manual", fuel: "Diesel", seats: 5, neighbourhood: "Kazanchis", latitude: 9.0107, longitude: 38.7684, pricePerDay: 6500, description: "A tough double-cab pickup for rough roads and longer journeys. Diesel, 4x4.", status: "approved", popularity: 74, photoIdx: 4 },
  { id: "car-suzuki-sarbet", ownerId: DEMO_IDS.ownerDawit, make: "Suzuki", model: "Swift", year: 2018, transmission: "Manual", fuel: "Petrol", seats: 5, neighbourhood: "Sarbet", latitude: 8.9951, longitude: 38.7262, pricePerDay: 2000, description: "Economical hatchback with low running costs. Good for daily errands and city driving.", status: "approved", popularity: 55, photoIdx: 5 },
  { id: "car-hyundai-megenagna", ownerId: DEMO_IDS.ownerDawit, make: "Hyundai", model: "Tucson", year: 2022, transmission: "Automatic", fuel: "Petrol", seats: 5, neighbourhood: "Megenagna", latitude: 9.0204, longitude: 38.7989, pricePerDay: 5800, description: "Modern crossover with a smooth ride and a great sound system. Pickup near Megenagna roundabout.", status: "approved", popularity: 80, photoIdx: 6 },
  { id: "car-vwpolo-gerji", ownerId: DEMO_IDS.ownerSelam, make: "Volkswagen", model: "Polo", year: 2019, transmission: "Automatic", fuel: "Petrol", seats: 5, neighbourhood: "Gerji", latitude: 9.0003, longitude: 38.807, pricePerDay: 3100, description: "Compact and comfortable with a quiet cabin. Automatic gearbox for stress-free traffic.", status: "approved", popularity: 47, photoIdx: 1 },
  { id: "car-minibus-lideta", ownerId: DEMO_IDS.ownerDawit, make: "Toyota", model: "HiAce", year: 2016, transmission: "Manual", fuel: "Diesel", seats: 12, neighbourhood: "Lideta", latitude: 9.0106, longitude: 38.7283, pricePerDay: 7500, description: "Spacious 12-seat van for family events, tours and group travel.", status: "approved", popularity: 39, photoIdx: 2 },
  { id: "car-yaris-ayat", ownerId: DEMO_IDS.ownerSelam, make: "Toyota", model: "Yaris", year: 2021, transmission: "Automatic", fuel: "Hybrid", seats: 5, neighbourhood: "Ayat", latitude: 9.0228, longitude: 38.8662, pricePerDay: 3300, description: "Newly listed hybrid hatchback waiting for admin approval.", status: "pending", popularity: 0, photoIdx: 3 },
  { id: "car-kia-oldairport", ownerId: DEMO_IDS.ownerDawit, make: "Kia", model: "Picanto", year: 2015, transmission: "Manual", fuel: "Petrol", seats: 4, neighbourhood: "Old Airport", latitude: 8.989, longitude: 38.73, pricePerDay: 1500, description: "Older budget hatchback. Listing was rejected for missing photos.", status: "rejected", popularity: 0, photoIdx: 4 },
  { id: "car-nissan-bole-inactive", ownerId: DEMO_IDS.ownerSelam, make: "Nissan", model: "Patrol", year: 2014, transmission: "Automatic", fuel: "Petrol", seats: 7, neighbourhood: "Bole", latitude: 8.9921, longitude: 38.7701, pricePerDay: 8200, description: "Large 7-seat SUV, temporarily deactivated by its owner.", status: "inactive", popularity: 20, photoIdx: 5 },
  { id: "car-draft-mercedes", ownerId: DEMO_IDS.ownerDawit, make: "Mercedes-Benz", model: "C200", year: 2018, transmission: "Automatic", fuel: "Petrol", seats: 5, neighbourhood: "Kazanchis", latitude: 9.0125, longitude: 38.7721, pricePerDay: 9000, description: "Draft listing, not yet submitted for review.", status: "draft", popularity: 0, photoIdx: 6 },
];

export function seedCars(now = new Date()): Car[] {
  const today = todayISO(now);
  return CARS.map(({ photoIdx, unavailableOffsets, ...c }, i) => ({
    ...c,
    city: "Addis Ababa",
    photos: [`/cars/car-${photoIdx}.svg`, "/cars/interior.svg"],
    unavailableDates: (unavailableOffsets ?? []).map((o) => addDays(today, o)),
    createdAt: new Date(now.getTime() - (60 - i * 3) * 86_400_000).toISOString(),
  }));
}

function mkBooking(
  id: string,
  car: Car,
  renterId: string,
  startOffset: number,
  nights: number,
  status: Booking["status"],
  payment: Booking["paymentStatus"],
  now: Date,
): Booking {
  const today = todayISO(now);
  const startDate = addDays(today, startOffset);
  const endDate = addDays(startDate, nights);
  const days = daysBetween(startDate, endDate);
  const subtotal = days * car.pricePerDay;
  const fee = Math.round(subtotal * FEE_RATE);
  const created = new Date(now.getTime() + (startOffset - 5) * 86_400_000).toISOString();
  return {
    id,
    carId: car.id,
    renterId,
    ownerId: car.ownerId,
    startDate,
    endDate,
    days,
    pricePerDay: car.pricePerDay,
    subtotal,
    fee,
    total: subtotal + fee,
    paymentStatus: payment,
    paymentRef: `TB-DEMO-${(10000000 + id.length * 7919 + startOffset * 31 + 50000000).toString().slice(0, 8)}`,
    status,
    createdAt: created,
    updatedAt: created,
  };
}

export function seedBookings(now = new Date()): Booking[] {
  const cars = seedCars(now);
  const car = (id: string) => cars.find((c) => c.id === id)!;
  const H = DEMO_IDS.renterHana;
  const Y = DEMO_IDS.renterYonas;
  return [
    mkBooking("bk-upcoming-confirmed", car("car-corolla-bole"), H, 10, 3, "confirmed", "paid", now),
    mkBooking("bk-upcoming-requested", car("car-rav4-cmc"), H, 20, 2, "requested", "held", now),
    mkBooking("bk-active", car("car-vitz-piassa"), H, -1, 3, "in_progress", "paid", now),
    mkBooking("bk-completed-needs-review", car("car-vwpolo-gerji"), H, -12, 2, "completed", "paid", now),
    mkBooking("bk-reviewed", car("car-corolla-bole"), H, -35, 3, "reviewed", "paid", now),
    mkBooking("bk-cancelled", car("car-hyundai-megenagna"), H, -50, 2, "cancelled", "refunded", now),
    mkBooking("bk-disputed", car("car-hilux-kazanchis"), H, -20, 4, "disputed", "paid", now),
    mkBooking("bk-resolved", car("car-suzuki-sarbet"), H, -70, 2, "resolved", "paid", now),
    mkBooking("bk-yonas-confirmed", car("car-hilux-kazanchis"), Y, 5, 2, "confirmed", "paid", now),
    mkBooking("bk-yonas-requested", car("car-corolla-bole"), Y, 25, 2, "requested", "held", now),
    mkBooking("bk-yonas-completed", car("car-rav4-cmc"), Y, -25, 3, "completed", "paid", now),
    mkBooking("bk-yonas-reviewed", car("car-rav4-cmc"), Y, -40, 2, "reviewed", "paid", now),
    mkBooking("bk-yonas-declined", car("car-minibus-lideta"), Y, -8, 1, "declined", "refunded", now),
  ];
}

export function seedReviews(now = new Date()): Review[] {
  const bookings = seedBookings(now);
  const b = bookings.find((x) => x.id === "bk-reviewed")!;
  const b2 = bookings.find((x) => x.id === "bk-yonas-reviewed")!;
  return [
    { id: "rv-2", bookingId: b2.id, carId: b2.carId, renterId: b2.renterId, ownerId: b2.ownerId, rating: 4, comment: "Smooth hybrid, great for the drive to Adama. Pickup in CMC was a little late but Selam kept me updated.", createdAt: new Date(now.getTime() - 37 * 86_400_000).toISOString() },
    { id: "rv-1", bookingId: b.id, carId: b.carId, renterId: b.renterId, ownerId: b.ownerId, rating: 5, comment: "Clean car, very easy pickup in Bole. Selam was friendly and flexible with the return time.", ownerReply: "Thank you Hana, you're welcome back anytime!", createdAt: new Date(now.getTime() - 31 * 86_400_000).toISOString() },
  ];
}

export function seedDisputes(now = new Date()): Dispute[] {
  const bookings = seedBookings(now);
  const open = bookings.find((x) => x.id === "bk-disputed")!;
  const done = bookings.find((x) => x.id === "bk-resolved")!;
  const t = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString();
  return [
    { id: "dp-open", bookingId: open.id, openedBy: open.renterId, reason: "Vehicle condition", description: "The air conditioning stopped working on the second day of the rental.", status: "open", messages: [{ by: open.renterId, text: "AC stopped working on day two.", at: t(18) }], createdAt: t(18) },
    { id: "dp-resolved", bookingId: done.id, openedBy: done.ownerId, reason: "Late return", description: "The car was returned three hours after the agreed time.", status: "resolved", resolutionNotes: "Late fee of ETB 500 agreed between both parties. Closed.", resolvedBy: DEMO_IDS.admin, messages: [], createdAt: t(66), resolvedAt: t(64) },
  ];
}

export function seedAnnouncements(now = new Date()): Announcement[] {
  return [
    { id: "an-1", title: "Welcome to the Sheggar Wheels demo", message: "Everything here is simulated: no real payments, no live tracking. Explore freely with the demo accounts.", active: true, createdAt: new Date(now.getTime() - 7 * 86_400_000).toISOString(), createdBy: DEMO_IDS.admin },
  ];
}
