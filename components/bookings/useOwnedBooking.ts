"use client";

import { useParams } from "next/navigation";
import { canViewBooking } from "@/lib/domain";
import { useBookings, useCars, useHydrated, useSession, useUsers } from "@/lib/hooks";

/** Loads a booking from the route and checks the viewer may see it. status: loading | missing | forbidden | ok */
export function useOwnedBooking() {
  const { id } = useParams<{ id: string }>();
  const hydrated = useHydrated();
  const { user } = useSession();
  const bookings = useBookings();
  const cars = useCars();
  const users = useUsers();
  const booking = bookings.find((b) => b.id === id) ?? null;
  const car = booking ? cars.find((c) => c.id === booking.carId) ?? null : null;
  const status: "loading" | "missing" | "forbidden" | "ok" = !hydrated || bookings.length === 0 ? (booking ? "ok" : "loading") : !booking ? "missing" : !canViewBooking(user, booking) ? "forbidden" : "ok";
  // A renter-only page must not show the owner's view of someone else's trip, so callers also compare renterId.
  return { id, user, booking, car, users, status };
}
