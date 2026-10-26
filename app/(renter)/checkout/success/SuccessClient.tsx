"use client";

import { useSearchParams } from "next/navigation";
import { Receipt, receiptFromBooking } from "@/components/bookings/Receipt";
import { BookingBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, Loading, Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDateRange } from "@/lib/format";
import { useBookings, useCars, useHydrated, useSession } from "@/lib/hooks";

export function SuccessClient() {
  const id = useSearchParams().get("booking");
  const hydrated = useHydrated();
  const { user } = useSession();
  const bookings = useBookings();
  const cars = useCars();
  const booking = bookings.find((b) => b.id === id);
  if (!hydrated || (bookings.length === 0 && id)) return <div className="page"><Loading /></div>;
  // Ownership check: only the renter who made the booking sees its receipt.
  if (!booking || booking.renterId !== user?.id)
    return <div className="page page--mid"><EmptyState title="We couldn't find that booking" action={<Button href="/bookings" variant="primary">My bookings</Button>}>Open it from your booking history instead.</EmptyState></div>;
  const car = cars.find((c) => c.id === booking.carId);
  return (
    <div className="page stack">
      <PageHeader title="Request sent!" sub="Your demo payment is held and the owner has been asked to approve." actions={<BookingBadge status={booking.status} />} />
      <Notice tone="success" title="Done.">This was a demo: no real charge was made. You'll see an alert on your dashboard when the owner replies.</Notice>
      <div className="grid-2">
        <section className="panel stack" aria-labelledby="t"><h2 id="t" className="h2">You're going places.</h2><p className="h3">{car ? `${car.year} ${car.make} ${car.model}` : "Your car"}</p><p className="muted">{formatDateRange(booking.startDate, booking.endDate)}{car ? ` · ⌖ ${car.neighbourhood}` : ""}</p></section>
        <section className="panel stack" aria-labelledby="r"><h2 id="r" className="h2">Demo receipt</h2><Receipt {...receiptFromBooking(booking)} />
          <div className="row"><Button href={`/bookings/${booking.id}`} variant="primary">View booking</Button><Button href="/dashboard" variant="secondary">Dashboard</Button></div></section>
      </div>
    </div>
  );
}
