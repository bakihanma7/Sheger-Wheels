export type Role = "renter" | "owner" | "admin";
export type UserStatus = "active" | "suspended";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  roles: Role[];
  status: UserStatus;
  createdAt: string;
  /** Demo-only salted PBKDF2 hash (see lib/password.ts). Absent on seeded accounts, which use the published demo password. */
  passwordSalt?: string;
  passwordHash?: string;
}

export type CarStatus = "draft" | "pending" | "approved" | "rejected" | "inactive";
export type Transmission = "Automatic" | "Manual";
export type Fuel = "Petrol" | "Diesel" | "Hybrid" | "Electric";

export interface Car {
  id: string;
  ownerId: string;
  make: string;
  model: string;
  year: number;
  transmission: Transmission;
  fuel: Fuel;
  seats: number;
  city: string;
  neighbourhood: string;
  latitude: number;
  longitude: number;
  pricePerDay: number;
  photos: string[];
  description: string;
  status: CarStatus;
  unavailableDates: string[]; // YYYY-MM-DD blocked by the owner
  popularity: number; // demo metric used for "popularity" sorting
  createdAt: string;
}

export type BookingStatus =
  | "requested"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "reviewed"
  | "declined"
  | "cancelled"
  | "disputed"
  | "resolved";

export type PaymentStatus = "held" | "paid" | "refunded";

export interface Booking {
  id: string;
  carId: string;
  renterId: string;
  ownerId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD (exclusive return day)
  days: number;
  pricePerDay: number; // snapshot at booking time
  subtotal: number;
  fee: number;
  total: number;
  paymentStatus: PaymentStatus;
  paymentRef: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  carId: string;
  renterId: string;
  ownerId: string;
  rating: number;
  comment: string;
  ownerReply?: string;
  createdAt: string;
}

export type DisputeStatus = "open" | "resolved";

export interface Dispute {
  id: string;
  bookingId: string;
  openedBy: string;
  reason: string;
  description: string;
  status: DisputeStatus;
  resolutionNotes?: string;
  resolvedBy?: string;
  messages: { by: string; text: string; at: string }[];
  createdAt: string;
  resolvedAt?: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
}

export interface SessionData {
  userId: string;
  signedInAt: string;
}

export interface CheckoutDraft {
  carId: string;
  startDate: string;
  endDate: string;
}

export type Result<T = undefined> = { ok: true; data: T } | { ok: false; error: string };
