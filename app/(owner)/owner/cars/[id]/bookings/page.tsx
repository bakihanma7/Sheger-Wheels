"use client";

import Link from "next/link";
import { BookingActions } from "@/components/bookings/BookingActions";
import { OwnedCarGate } from "@/components/owner/OwnedCarGate";
import { useOwnedCar } from "@/components/owner/useOwnedCar";
import { BookingBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDateRange, formatETB } from "@/lib/format";
import { useBookings, useUsers } from "@/lib/hooks";

export default function CarBookingsPage() {
  const { car, status } = useOwnedCar();
  const bookings = useBookings();
  const users = useUsers();
  const list = bookings.filter((b) => b.carId === car?.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pending = list.filter((b) => b.status === "requested");
  const rest = list.filter((b) => b.status !== "requested");

  const card = (b: (typeof list)[number]) => (
    <article key={b.id} className="panel stack stack--sm">
      <div className="row row--between">
        <p className="h3">{users.find((u) => u.id === b.renterId)?.name ?? "Renter"}</p>
        <BookingBadge status={b.status} />
      </div>
      <p className="muted">{formatDateRange(b.startDate, b.endDate)} · {b.days} day{b.days === 1 ? "" : "s"} · you earn {formatETB(b.subtotal)}</p>
      <BookingActions booking={b} />
    </article>
  );

  return (
    <div className="stack">
      <OwnedCarGate status={status}>
        {car && (
          <>
            <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/owner/cars">My cars</Link> / {car.make} {car.model} / Bookings</nav>
            <PageHeader title="Requests and bookings" sub={`${car.year} ${car.make} ${car.model}`} />
            <section className="stack" aria-labelledby="pend"><h2 id="pend" className="h2">Waiting for you ({pending.length})</h2>
              {pending.length ? pending.map(card) : <EmptyState title="No pending requests">New requests will appear here.</EmptyState>}</section>
            <section className="stack" aria-labelledby="all"><h2 id="all" className="h2">Everything else ({rest.length})</h2>
              {rest.length ? rest.map(card) : <p className="muted">Nothing yet.</p>}</section>
          </>
        )}
      </OwnedCarGate>
    </div>
  );
}
