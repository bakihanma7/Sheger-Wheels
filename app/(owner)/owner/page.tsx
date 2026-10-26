"use client";

import Link from "next/link";
import { useMemo } from "react";
import { EarningsChart } from "@/components/charts/Charts";
import { BookingsTable, bookingColumns } from "@/components/bookings/BookingsTable";
import { Button } from "@/components/ui/Button";
import { EmptyState, Loading } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatETB } from "@/lib/format";
import { useBookings, useCars, useHydrated, useSession, useUsers } from "@/lib/hooks";
import { ownerStats } from "@/lib/selectors";

export default function OwnerOverviewPage() {
  const hydrated = useHydrated();
  const { user } = useSession();
  const cars = useCars();
  const bookings = useBookings();
  const users = useUsers();
  const s = useMemo(() => (user ? ownerStats(cars, bookings, user.id) : null), [cars, bookings, user]);
  if (!user || !s) return null;
  if (!hydrated) return <Loading />;
  const recent = [...s.mine].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  const cols = bookingColumns({ cars, users, showRenter: true, href: (b) => `/owner/cars/${b.carId}/bookings` });

  return (
    <div className="stack">
      <PageHeader eyebrow="Owner workspace" title="Overview" sub="Your cars, requests and earnings at a glance." actions={<Button href="/owner/cars/new" variant="amber">Add a car</Button>} />
      <section className="grid-4" aria-label="Key numbers">
        <div className="metric"><span className="metric__label">Approved cars</span><span className="metric__value">{s.approvedCars}</span><span className="metric__hint">of {s.myCars.length} listed</span></div>
        <div className="metric"><span className="metric__label">Pending requests</span><span className="metric__value">{s.pendingRequests}</span><span className="metric__hint">{s.pendingRequests ? <Link href="/owner/cars"><u>Review them</u></Link> : "Nothing waiting"}</span></div>
        <div className="metric"><span className="metric__label">Confirmed rentals</span><span className="metric__value">{s.confirmedRentals}</span><span className="metric__hint">Confirmed or in progress</span></div>
        <div className="metric"><span className="metric__label">Total earnings</span><span className="metric__value">{formatETB(s.totalEarnings)}</span><span className="metric__hint">Completed trips, before platform fee</span></div>
      </section>
      <div className="grid-2">
        <section className="panel">{s.earningsByMonth.length ? <EarningsChart data={s.earningsByMonth} /> : <EmptyState title="No earnings yet">Earnings appear once a trip is completed.</EmptyState>}</section>
        <section className="panel stack" aria-labelledby="util">
          <h2 id="util" className="h2">Your cars, at work</h2>
          <p className="muted small">Share of the last 30 days each car was booked.</p>
          {s.utilization.length === 0 ? <p className="muted">Add a car to see utilization.</p> : s.utilization.map((u) => (
            <div key={u.carId}>
              <div className="row row--between"><span>{u.name}</span><span className="muted small">{u.percent}% · {u.bookedDays}/{u.windowDays} days</span></div>
              <div role="progressbar" aria-label={`${u.name} utilization`} aria-valuenow={u.percent} aria-valuemin={0} aria-valuemax={100} style={{ height: 8, background: "var(--c-border)", borderRadius: 4, marginTop: 6 }}>
                <div style={{ width: `${Math.max(u.percent, 1)}%`, height: "100%", background: "var(--c-brand)", borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </section>
      </div>
      <section className="stack">
        <h2 className="h2">Recent requests and rentals</h2>
        <BookingsTable bookings={recent} caption="Recent bookings for your cars" columns={cols} empty={<EmptyState title="No bookings yet">When renters request your cars, they show up here.</EmptyState>} />
      </section>
    </div>
  );
}
