"use client";

import Link from "next/link";
import { BookingActions } from "@/components/bookings/BookingActions";
import { Receipt, receiptFromBooking } from "@/components/bookings/Receipt";
import { Timeline } from "@/components/bookings/Timeline";
import { useOwnedBooking } from "@/components/bookings/useOwnedBooking";
import { BookingBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CarImage } from "@/components/ui/CarImage";
import { EmptyState, Loading, Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDateRange } from "@/lib/format";

export default function BookingDetailPage() {
  const { booking, car, user, users, status } = useOwnedBooking();

  if (status === "loading") return <div className="page"><Loading /></div>;
  if (status === "missing")
    return <div className="page page--mid"><EmptyState title="Booking not found" action={<Button href="/bookings" variant="primary">My bookings</Button>}>It may have been removed, or the link is wrong.</EmptyState></div>;
  // Renters may only open THEIR OWN bookings here (owners manage theirs under /owner).
  if (status === "forbidden" || !booking || !user || booking.renterId !== user.id)
    return <div className="page page--mid"><Notice tone="error" title="Not yours.">This booking belongs to another account, so its details are hidden.</Notice><p style={{ marginTop: 16 }}><Link href="/bookings" className="btn btn--primary">Back to my bookings</Link></p></div>;

  const owner = users.find((u) => u.id === booking.ownerId);
  return (
    <div className="page stack">
      <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/bookings">My bookings</Link> / {car ? `${car.make} ${car.model}` : "Booking"}</nav>
      <PageHeader title={car ? `${car.year} ${car.make} ${car.model}` : "Booking"} sub={`${formatDateRange(booking.startDate, booking.endDate)} · ${booking.days} day${booking.days === 1 ? "" : "s"}`} actions={<BookingBadge status={booking.status} />} />
      <div className="split">
        <div className="stack">
          <section className="panel stack" aria-labelledby="trip">
            <h2 id="trip" className="h2">Your trip</h2>
            {car && (
              <div className="row" style={{ alignItems: "flex-start" }}>
                <div className="car-card__img" style={{ width: 280, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}><CarImage src={car.photos[0]} alt={`${car.make} ${car.model}`} sizes="280px" /></div>
                <div className="stack stack--sm">
                  <p>⌖ {car.neighbourhood}, {car.city}</p>
                  <p className="muted">Host: {owner?.name ?? "Unknown"}</p>
                  <Link href={`/cars/${car.id}`}><u>View listing</u></Link>
                </div>
              </div>
            )}
            {booking.status === "in_progress" && <p><Link href={`/bookings/${booking.id}/track`} className="btn btn--secondary">Open trip tracking (simulation)</Link></p>}
            <BookingActions booking={booking} showReview />
          </section>
          <section className="panel stack" aria-labelledby="timeline">
            <h2 id="timeline" className="h2">Trip timeline</h2>
            <Timeline booking={booking} />
          </section>
        </div>
        <aside className="stack">
          <section className="panel stack" aria-labelledby="receipt">
            <h2 id="receipt" className="h2">Your receipt</h2>
            <Receipt {...receiptFromBooking(booking)} />
            <p className="muted small">Payment: {booking.paymentStatus} (demo). Price was locked at booking time.</p>
          </section>
          {booking.status === "requested" && <Notice tone="info" title="Waiting for the owner.">You'll get an alert here when they respond.</Notice>}
          {booking.status === "disputed" && <Notice tone="warn" title="Issue under review.">An admin will review this and record a resolution.</Notice>}
        </aside>
      </div>
    </div>
  );
}
