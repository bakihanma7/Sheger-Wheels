"use client";

import Link from "next/link";
import { useMemo } from "react";
import { BookingsTable, bookingColumns } from "@/components/bookings/BookingsTable";
import { BookingBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CarImage } from "@/components/ui/CarImage";
import { EmptyState, Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAnnouncements, useBookings, useCars, useDisputes, useSession, useUsers } from "@/lib/hooks";
import { activeAnnouncements, deriveNotifications, renterStats } from "@/lib/selectors";
import { formatDate, formatDateRange, formatETB, relativeTime } from "@/lib/format";

export default function DashboardPage() {
  const { user } = useSession();
  const cars = useCars();
  const users = useUsers();
  const bookings = useBookings();
  const disputes = useDisputes();
  const announcements = useAnnouncements();
  const stats = useMemo(() => (user ? renterStats(bookings, user.id) : null), [bookings, user]);
  const alerts = useMemo(() => (user ? deriveNotifications(user, cars, bookings, disputes) : []), [user, cars, bookings, disputes]);
  if (!user || !stats) return null;

  const next = stats.nextBooking;
  const nextCar = next && cars.find((c) => c.id === next.carId);
  const recent = [...stats.mine].sort((a, b) => b.startDate.localeCompare(a.startDate)).slice(0, 5);
  const cols = bookingColumns({ cars, users, href: (b) => `/bookings/${b.id}` });

  return (
    <div className="page stack">
      <PageHeader eyebrow="Renter dashboard" title={`Hello, ${user.name.split(" ")[0]}`} sub="Your upcoming trips and past journeys." actions={<Button href="/cars" variant="amber">Find a car</Button>} />
      {activeAnnouncements(announcements).slice(0, 2).map((a) => (
        <Notice key={a.id} tone="info" title={`${a.title}.`}>{a.message}</Notice>
      ))}

      <section className="grid-4" aria-label="Your numbers">
        <div className="metric"><span className="metric__label">Upcoming trips</span><span className="metric__value">{stats.upcoming.length}</span><span className="metric__hint">Requested, confirmed or under way</span></div>
        <div className="metric"><span className="metric__label">Completed trips</span><span className="metric__value">{stats.completedCount}</span><span className="metric__hint">Including reviewed</span></div>
        <div className="metric"><span className="metric__label">Cancelled trips</span><span className="metric__value">{stats.cancelledCount}</span><span className="metric__hint">Refunded in the demo</span></div>
        <div className="metric"><span className="metric__label">Total demo spend</span><span className="metric__value">{formatETB(stats.totalSpend)}</span><span className="metric__hint">Mock payments only</span></div>
      </section>

      <div className="grid-2">
        <section className="panel stack" aria-labelledby="next-trip">
          <h2 id="next-trip" className="h2">Your next journey</h2>
          {next && nextCar ? (
            <>
              <BookingBadge status={next.status} />
              <div className="car-card__img" style={{ borderRadius: 12, overflow: "hidden" }}><CarImage src={nextCar.photos[0]} alt={`${nextCar.make} ${nextCar.model}`} sizes="600px" /></div>
              <div>
                <p className="h3">{nextCar.year} {nextCar.make} {nextCar.model}</p>
                <p className="muted">{formatDateRange(next.startDate, next.endDate)} · ⌖ {nextCar.neighbourhood}</p>
                <p className="price">{formatETB(next.total)} total</p>
              </div>
              <div className="row">
                <Button href={`/bookings/${next.id}`} variant="primary">View booking</Button>
                {next.status === "in_progress" && <Button href={`/bookings/${next.id}/track`} variant="secondary">Track trip (simulation)</Button>}
              </div>
            </>
          ) : (
            <EmptyState title="No upcoming trips" action={<Button href="/cars" variant="primary">Browse cars</Button>}>When you book a car, your next trip shows up here.</EmptyState>
          )}
        </section>

        <section className="panel stack" aria-labelledby="alerts">
          <h2 id="alerts" className="h2">Alerts <span className="sim-label">Simulation</span></h2>
          {alerts.length === 0 ? (
            <p className="muted">You're all caught up.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }} className="stack stack--sm">
              {alerts.map((n) => (
                <li key={n.id} className="notice">
                  <Link href={n.href}><u>{n.text}</u></Link>
                  <div className="muted small">{relativeTime(n.at)}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="stack" aria-labelledby="recent">
        <div className="row row--between">
          <h2 id="recent" className="h2">Recent bookings</h2>
          <Link href="/bookings" className="btn btn--secondary">All bookings →</Link>
        </div>
        <BookingsTable bookings={recent} caption="Your most recent bookings" columns={cols} empty={<EmptyState title="You have no bookings yet" action={<Button href="/cars" variant="primary">Browse cars</Button>}>Request your first trip and it will appear here.</EmptyState>} />
      </section>
      <p className="muted small">Joined {formatDate(user.createdAt)} · Demo account, nothing here is real.</p>
    </div>
  );
}
